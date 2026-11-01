-- Performance: RLS checks run once per query instead of once per row, plus missing indexes.
--
-- Before: `using (public.is_member(tenant_id))` called a security-definer function for every row
-- (and every embedded row: orders → clients, assets, staff), each doing two lookups.
-- After: `(select public.is_platform_admin())` is an InitPlan and `tenant_id in (select public.my_tenant_ids())`
-- a hashed SubPlan — both evaluated once per statement. Semantics are unchanged.

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────
create or replace function public.my_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.memberships where user_id = auth.uid();
$$;

-- Tenants where the caller has one of the given roles.
create or replace function public.my_tenant_ids_with_role(roles text[])
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.memberships where user_id = auth.uid() and role = any (roles);
$$;

revoke execute on function public.my_tenant_ids() from public, anon;
revoke execute on function public.my_tenant_ids_with_role(text[]) from public, anon;
grant execute on function public.my_tenant_ids() to authenticated;
grant execute on function public.my_tenant_ids_with_role(text[]) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Tenant isolation on all CRM tables
-- ─────────────────────────────────────────────────────────────
do $$
declare
  tbl text;
begin
  foreach tbl in array array['staff', 'clients', 'assets', 'catalog_items', 'orders', 'order_items', 'payments', 'reminders']
  loop
    execute format('drop policy if exists "tenant isolation" on public.%I', tbl);
    execute format(
      'create policy "tenant isolation" on public.%I for all
         using ((select public.is_platform_admin()) or tenant_id in (select public.my_tenant_ids()))
         with check ((select public.is_platform_admin()) or tenant_id in (select public.my_tenant_ids()))',
      tbl
    );
  end loop;
end;
$$;

-- Cash book: staff see only payments attached to an order (evaluated on every listed payment).
drop policy if exists "staff see order payments only" on public.payments;
create policy "staff see order payments only" on public.payments as restrictive for select
  using (
    order_id is not null
    or (select public.is_platform_admin())
    or tenant_id in (select public.my_tenant_ids_with_role(array['owner', 'manager']))
  );

drop policy if exists "members read tenant" on public.tenants;
create policy "members read tenant" on public.tenants
  for select using ((select public.is_platform_admin()) or id in (select public.my_tenant_ids()));

drop policy if exists "members read memberships" on public.memberships;
create policy "members read memberships" on public.memberships
  for select using (
    user_id = (select auth.uid())
    or (select public.is_platform_admin())
    or tenant_id in (select public.my_tenant_ids())
  );

-- ─────────────────────────────────────────────────────────────
-- Indexes for the app's hot queries and FK cascades
-- ─────────────────────────────────────────────────────────────
create index if not exists orders_staff_idx on public.orders (staff_id) where staff_id is not null;   -- my work, team load
create index if not exists orders_asset_idx on public.orders (asset_id);                               -- search by plate, asset delete
create index if not exists orders_closed_idx on public.orders (tenant_id, closed_at) where closed_at is not null; -- payroll
create index if not exists order_items_staff_idx on public.order_items (staff_id) where staff_id is not null;
create index if not exists order_items_catalog_idx on public.order_items (catalog_item_id) where catalog_item_id is not null;
create index if not exists reminders_client_idx on public.reminders (client_id);
create index if not exists reminders_asset_idx on public.reminders (asset_id);
create index if not exists reminders_order_idx on public.reminders (order_id) where order_id is not null;

-- ─────────────────────────────────────────────────────────────
-- Fix: opening an invite link while already a member of that business used to consume the
-- invitation and create an orphan staff row. Now it just returns the business, leaving the link usable.
-- ─────────────────────────────────────────────────────────────
create or replace function public.accept_invitation(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations;
  slug text;
  sid uuid;
  who text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into inv from public.invitations where token = p_token for update;
  if inv.id is null or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'invitation invalid or expired';
  end if;

  select t.slug into slug from public.tenants t where t.id = inv.tenant_id;
  if exists (select 1 from public.memberships where tenant_id = inv.tenant_id and user_id = auth.uid()) then
    return slug;
  end if;

  if inv.role = 'staff' then
    sid := inv.staff_id;
    if sid is null or exists (select 1 from public.memberships where tenant_id = inv.tenant_id and staff_id = sid) then
      select coalesce(nullif(inv.name, ''), p.full_name, p.email) into who from public.profiles p where p.id = auth.uid();
      insert into public.staff (tenant_id, name) values (inv.tenant_id, coalesce(who, 'Usta')) returning id into sid;
    end if;
  end if;

  insert into public.memberships (tenant_id, user_id, role, staff_id)
  values (inv.tenant_id, auth.uid(), inv.role, sid)
  on conflict (tenant_id, user_id) do nothing;

  update public.invitations set accepted_by = auth.uid(), accepted_at = now() where id = inv.id;
  return slug;
end;
$$;

revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Fix: restocking read the stock and wrote it back, so two parallel restocks lost one of them.
-- Atomic increment; security invoker, so the "managers update catalog" policy still applies.
-- ─────────────────────────────────────────────────────────────
create or replace function public.restock_catalog_item(p_id uuid, p_qty numeric)
returns numeric
language sql
security invoker
set search_path = public
as $$
  update public.catalog_items set stock = coalesce(stock, 0) + p_qty
  where id = p_id and p_qty > 0
  returning stock;
$$;

revoke execute on function public.restock_catalog_item(uuid, numeric) from public, anon;
grant execute on function public.restock_catalog_item(uuid, numeric) to authenticated;

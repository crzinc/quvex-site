-- Team roles with real permissions, invitation links, and order discounts.
--
-- Roles:  owner   — everything, incl. team, business settings, billing view
--         manager — everything operational (finance, prices, payroll, deletes), no team/settings
--         staff   — a mechanic: works with orders/clients/reminders, accepts order payments,
--                   cannot see cash/expenses, change prices or payroll, or delete anything

-- ─────────────────────────────────────────────────────────────
-- Role helper
-- ─────────────────────────────────────────────────────────────
create or replace function public.has_role(t uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
      or exists (select 1 from public.memberships where tenant_id = t and user_id = auth.uid() and role = any (roles));
$$;

-- Restrictive policies are AND-ed with the existing "tenant isolation" policies.
-- Deletes: owner/manager only.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['clients', 'assets', 'catalog_items', 'orders', 'order_items', 'payments', 'reminders', 'staff']
  loop
    execute format(
      'create policy "managers delete" on public.%I as restrictive for delete using (public.has_role(tenant_id, array[''owner'', ''manager'']))',
      tbl
    );
  end loop;
end;
$$;

-- Prices, stock and payroll settings: owner/manager write; staff can still read the catalog to fill orders.
create policy "managers write catalog" on public.catalog_items as restrictive for insert
  with check (public.has_role(tenant_id, array['owner', 'manager']));
create policy "managers update catalog" on public.catalog_items as restrictive for update
  using (public.has_role(tenant_id, array['owner', 'manager']));
create policy "managers write staff" on public.staff as restrictive for insert
  with check (public.has_role(tenant_id, array['owner', 'manager']));
create policy "managers update staff" on public.staff as restrictive for update
  using (public.has_role(tenant_id, array['owner', 'manager']));

-- Cash book: staff see and record only payments attached to an order.
create policy "staff see order payments only" on public.payments as restrictive for select
  using (order_id is not null or public.has_role(tenant_id, array['owner', 'manager']));
create policy "staff record order payments only" on public.payments as restrictive for insert
  with check (
    (order_id is not null and direction = 'in')
    or public.has_role(tenant_id, array['owner', 'manager'])
  );
create policy "managers update payments" on public.payments as restrictive for update
  using (public.has_role(tenant_id, array['owner', 'manager']));

-- Stock is decremented by a trigger when a mechanic adds a part; it runs as definer, so the
-- catalog update restriction above does not block it.

-- ─────────────────────────────────────────────────────────────
-- Membership management (owner only)
-- ─────────────────────────────────────────────────────────────
create policy "owners update memberships" on public.memberships
  for update using (public.has_role(tenant_id, array['owner']))
  with check (public.has_role(tenant_id, array['owner']));
create policy "owners remove memberships" on public.memberships
  for delete using (public.has_role(tenant_id, array['owner']) and user_id <> auth.uid());

-- A business must always keep at least one owner.
create or replace function public.guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t uuid := coalesce(old.tenant_id, new.tenant_id);
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if not exists (
      select 1 from public.memberships
      where tenant_id = t and role = 'owner' and user_id <> old.user_id
    ) then
      raise exception 'last owner cannot be removed or demoted';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger memberships_last_owner
  before update or delete on public.memberships
  for each row execute function public.guard_last_owner();

-- ─────────────────────────────────────────────────────────────
-- Invitations: shareable link (WhatsApp) instead of e-mail infrastructure
-- ─────────────────────────────────────────────────────────────
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  role text not null check (role in ('manager', 'staff')),
  name text,
  created_by uuid references public.profiles (id) on delete set null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create index invitations_tenant_idx on public.invitations (tenant_id, created_at desc);

alter table public.invitations enable row level security;

create policy "owners manage invitations" on public.invitations
  for all using (public.has_role(tenant_id, array['owner']))
  with check (public.has_role(tenant_id, array['owner']));

-- Public preview of an invite by token (business name + role) for the accept page.
create or replace function public.invitation_preview(p_token text)
returns table (tenant_name text, role text, valid boolean)
language sql
stable
security definer
set search_path = public
as $$
  select t.name, i.role, (i.accepted_at is null and i.expires_at > now())
  from public.invitations i
  join public.tenants t on t.id = i.tenant_id
  where i.token = p_token;
$$;

create or replace function public.accept_invitation(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations;
  slug text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into inv from public.invitations where token = p_token for update;
  if inv.id is null or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'invitation invalid or expired';
  end if;

  insert into public.memberships (tenant_id, user_id, role)
  values (inv.tenant_id, auth.uid(), inv.role)
  on conflict (tenant_id, user_id) do nothing;

  update public.invitations set accepted_by = auth.uid(), accepted_at = now() where id = inv.id;
  select t.slug into slug from public.tenants t where t.id = inv.tenant_id;
  return slug;
end;
$$;

revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.invitation_preview(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Order discount (percent of the whole order)
-- ─────────────────────────────────────────────────────────────
alter table public.orders
  add column subtotal numeric(12, 2) not null default 0,
  add column discount_percent numeric(5, 2) not null default 0 check (discount_percent between 0 and 100);

update public.orders set subtotal = total;

create or replace function public.recalc_order(p_order uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.orders o set
    subtotal = s.subtotal,
    total = round(s.subtotal * (1 - o.discount_percent / 100), 2),
    paid = coalesce((select sum(amount) from public.payments where order_id = p_order and direction = 'in'), 0)
  from (select coalesce(sum(qty * price), 0) as subtotal from public.order_items where order_id = p_order) s
  where o.id = p_order;
$$;

revoke execute on function public.recalc_order(uuid) from public, anon, authenticated;

-- Changing the discount recalculates the total.
create or replace function public.on_order_discount_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.discount_percent is distinct from old.discount_percent then
    new.total := round(new.subtotal * (1 - new.discount_percent / 100), 2);
  end if;
  return new;
end;
$$;

create trigger orders_discount
  before update of discount_percent on public.orders
  for each row execute function public.on_order_discount_change();

-- Only owner/manager may give discounts.
create or replace function public.guard_order_discount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.discount_percent is distinct from old.discount_percent
     and not public.has_role(new.tenant_id, array['owner', 'manager']) then
    raise exception 'only owner or manager can set a discount';
  end if;
  return new;
end;
$$;

create trigger orders_discount_guard
  before update of discount_percent on public.orders
  for each row execute function public.guard_order_discount();

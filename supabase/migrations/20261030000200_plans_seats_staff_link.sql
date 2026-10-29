-- Seat limits per plan, and linking a staff login to its row in the staff (masters) list.

-- ─────────────────────────────────────────────────────────────
-- Seats: user_limit is set from the plan by the platform admin (null = unlimited).
-- Default 10 matches the trial, which gets Pro limits (src/config/plans.ts).
-- ─────────────────────────────────────────────────────────────
alter table public.tenants add column user_limit integer default 10 check (user_limit is null or user_limit > 0);

create or replace function public.guard_tenant_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only signed-in end users are restricted; the SQL editor / service role (no auth.uid()) is trusted.
  if auth.uid() is not null and not public.is_platform_admin() then
    new.plan := old.plan;
    new.status := old.status;
    new.trial_ends_at := old.trial_ends_at;
    new.paid_until := old.paid_until;
    new.user_limit := old.user_limit;
    new.slug := old.slug;
    new.niche := old.niche;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_user_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim integer;
  used integer;
begin
  select user_limit into lim from public.tenants where id = new.tenant_id;
  if lim is not null then
    select count(*) into used from public.memberships where tenant_id = new.tenant_id;
    if used >= lim then
      raise exception 'user limit reached' using errcode = 'P0002';
    end if;
  end if;
  return new;
end;
$$;

create trigger memberships_user_limit
  before insert on public.memberships
  for each row execute function public.enforce_user_limit();

-- ─────────────────────────────────────────────────────────────
-- Staff login ↔ staff row (for "my work" and "my earnings")
-- ─────────────────────────────────────────────────────────────
alter table public.memberships add column staff_id uuid references public.staff (id) on delete set null;
create unique index memberships_staff_unique on public.memberships (tenant_id, staff_id) where staff_id is not null;

alter table public.invitations add column staff_id uuid references public.staff (id) on delete set null;

-- Joining as staff links (or creates) the master row, so orders and payroll attach to the person.
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
  select t.slug into slug from public.tenants t where t.id = inv.tenant_id;
  return slug;
end;
$$;

revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;

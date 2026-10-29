-- Quvex — multi-tenant vertical CRM
-- Every business table carries tenant_id; access is enforced by RLS through memberships.
-- Niche-specific behaviour lives in src/niches/* (code config) + tenants.settings (overrides).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Profiles (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  locale text not null default 'az',
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, locale)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'locale', 'az')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Tenants (businesses) and memberships
-- ─────────────────────────────────────────────────────────────
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  name text not null,
  niche text not null,
  city text,
  phone text,
  address text,
  plan text not null default 'trial',          -- trial | start | pro
  status text not null default 'active',       -- active | suspended
  trial_ends_at timestamptz not null default now() + interval '14 days',
  paid_until timestamptz,
  modules text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb, -- terminology/status overrides, currency, etc.
  order_seq integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.memberships (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

-- Helpers used by RLS. security definer avoids recursive policy evaluation.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.memberships where tenant_id = t and user_id = auth.uid())
      or public.is_platform_admin();
$$;

-- Creates a tenant and makes the caller its owner. Seeding of niche defaults happens in the app.
create or replace function public.create_tenant(
  p_slug text,
  p_name text,
  p_niche text,
  p_city text,
  p_phone text,
  p_modules text[]
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tenants;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.tenants (slug, name, niche, city, phone, modules)
  values (p_slug, p_name, p_niche, p_city, p_phone, coalesce(p_modules, '{}'))
  returning * into t;

  insert into public.memberships (tenant_id, user_id, role) values (t.id, auth.uid(), 'owner');
  return t;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- CRM entities
-- ─────────────────────────────────────────────────────────────
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  phone text,
  position text,
  commission_percent numeric(5, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index staff_tenant_idx on public.staff (tenant_id);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  source text,
  created_at timestamptz not null default now()
);
create index clients_tenant_idx on public.clients (tenant_id, created_at desc);

-- Generic "object of service": a car for auto niches, a pet for vets, etc.
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  kind text not null default 'vehicle',
  title text not null,               -- e.g. "Toyota Camry"
  identifier text,                   -- e.g. plate number
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index assets_tenant_idx on public.assets (tenant_id);
create index assets_client_idx on public.assets (client_id);
create index assets_identifier_idx on public.assets (tenant_id, identifier);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  kind text not null check (kind in ('service', 'part')),
  name text not null,
  category text,
  sku text,
  price numeric(12, 2) not null default 0,
  cost numeric(12, 2) not null default 0,
  stock numeric(12, 2),              -- null = not tracked
  duration_min integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index catalog_tenant_idx on public.catalog_items (tenant_id, kind);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  number integer not null,
  client_id uuid references public.clients (id) on delete set null,
  asset_id uuid references public.assets (id) on delete set null,
  staff_id uuid references public.staff (id) on delete set null,
  status text not null,
  scheduled_at timestamptz,
  notes text,
  attributes jsonb not null default '{}'::jsonb,  -- niche fields, e.g. mileage at intake
  total numeric(12, 2) not null default 0,
  paid numeric(12, 2) not null default 0,
  debt numeric(12, 2) generated always as (total - paid) stored,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, number)
);
create index orders_tenant_idx on public.orders (tenant_id, created_at desc);
create index orders_status_idx on public.orders (tenant_id, status);
create index orders_client_idx on public.orders (client_id);
create index orders_debt_idx on public.orders (tenant_id) where debt > 0;

create or replace function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tenants set order_seq = order_seq + 1
  where id = new.tenant_id
  returning order_seq into new.number;
  return new;
end;
$$;

create trigger orders_number
  before insert on public.orders
  for each row execute function public.assign_order_number();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  kind text not null check (kind in ('service', 'part')),
  name text not null,
  qty numeric(12, 2) not null default 1 check (qty > 0),
  price numeric(12, 2) not null default 0,
  staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  direction text not null default 'in' check (direction in ('in', 'out')),
  amount numeric(12, 2) not null check (amount > 0),
  method text not null default 'cash',   -- cash | card | transfer
  category text,
  note text,
  created_at timestamptz not null default now()
);
create index payments_tenant_idx on public.payments (tenant_id, created_at desc);
create index payments_order_idx on public.payments (order_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  title text not null,
  due_at date not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'done', 'dismissed')),
  created_at timestamptz not null default now()
);
create index reminders_tenant_idx on public.reminders (tenant_id, status, due_at);

-- Keep order totals consistent no matter who writes items/payments.
create or replace function public.recalc_order(p_order uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.orders o set
    total = coalesce((select sum(qty * price) from public.order_items where order_id = p_order), 0),
    paid  = coalesce((select sum(amount) from public.payments where order_id = p_order and direction = 'in'), 0)
  where o.id = p_order;
$$;

create or replace function public.on_order_child_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.order_id is not null then perform public.recalc_order(old.order_id); end if;
    return old;
  end if;
  if new.order_id is not null then perform public.recalc_order(new.order_id); end if;
  if tg_op = 'UPDATE' and old.order_id is distinct from new.order_id and old.order_id is not null then
    perform public.recalc_order(old.order_id);
  end if;
  return new;
end;
$$;

create trigger order_items_recalc
  after insert or update or delete on public.order_items
  for each row execute function public.on_order_child_change();

create trigger payments_recalc
  after insert or update or delete on public.payments
  for each row execute function public.on_order_child_change();

-- Parts stock: decrement when a tracked part is added to an order, restore on removal.
create or replace function public.on_order_item_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.kind = 'part' and old.catalog_item_id is not null then
    update public.catalog_items set stock = stock + old.qty
    where id = old.catalog_item_id and stock is not null;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.kind = 'part' and new.catalog_item_id is not null then
    update public.catalog_items set stock = stock - new.qty
    where id = new.catalog_item_id and stock is not null;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger order_items_stock
  after insert or update or delete on public.order_items
  for each row execute function public.on_order_item_stock();

-- ─────────────────────────────────────────────────────────────
-- Platform-level: leads from the landing page and subscription payments
-- ─────────────────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  business_name text,
  niche text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create table public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  plan text not null,
  amount numeric(12, 2) not null,
  months integer not null default 1,
  method text,
  note text,
  created_at timestamptz not null default now()
);
create index billing_tenant_idx on public.billing_payments (tenant_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.staff enable row level security;
alter table public.clients enable row level security;
alter table public.assets enable row level security;
alter table public.catalog_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reminders enable row level security;
alter table public.leads enable row level security;
alter table public.billing_payments enable row level security;

create policy "own profile" on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());
create policy "teammates read profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.memberships mine
      join public.memberships theirs on theirs.tenant_id = mine.tenant_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and is_platform_admin = public.is_platform_admin());

create policy "members read tenant" on public.tenants
  for select using (public.is_member(id));
create policy "owners update tenant" on public.tenants
  for update using (
    public.is_platform_admin()
    or exists (select 1 from public.memberships m where m.tenant_id = tenants.id and m.user_id = auth.uid() and m.role = 'owner')
  );
-- Billing fields can only be changed by platform admins.
create or replace function public.guard_tenant_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    new.plan := old.plan;
    new.status := old.status;
    new.trial_ends_at := old.trial_ends_at;
    new.paid_until := old.paid_until;
    new.slug := old.slug;
    new.niche := old.niche;
  end if;
  return new;
end;
$$;
create trigger tenants_guard_billing
  before update on public.tenants
  for each row execute function public.guard_tenant_billing();

create policy "members read memberships" on public.memberships
  for select using (user_id = auth.uid() or public.is_member(tenant_id));

-- Uniform tenant isolation for all CRM tables.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['staff', 'clients', 'assets', 'catalog_items', 'orders', 'order_items', 'payments', 'reminders']
  loop
    execute format(
      'create policy "tenant isolation" on public.%I for all using (public.is_member(tenant_id)) with check (public.is_member(tenant_id))',
      tbl
    );
  end loop;
end;
$$;

create policy "anyone can submit a lead" on public.leads
  for insert to anon, authenticated with check (status = 'new');
create policy "admins manage leads" on public.leads
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "admins manage billing" on public.billing_payments
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "members read billing" on public.billing_payments
  for select using (public.is_member(tenant_id));

revoke execute on function public.recalc_order(uuid) from public, anon, authenticated;
revoke execute on function public.create_tenant(text, text, text, text, text, text[]) from public, anon;
grant execute on function public.create_tenant(text, text, text, text, text, text[]) to authenticated;

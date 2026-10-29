-- The last-owner guard must not block cascades: deleting the whole business, or deleting the user account.
create or replace function public.guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t uuid := coalesce(old.tenant_id, new.tenant_id);
begin
  if tg_op = 'DELETE' and (
    not exists (select 1 from public.tenants where id = old.tenant_id)
    or not exists (select 1 from public.profiles where id = old.user_id)
  ) then
    return old;
  end if;

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

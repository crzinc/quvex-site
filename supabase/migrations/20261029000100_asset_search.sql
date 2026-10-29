-- Plate/identifier search that ignores spaces, dashes and case: "90rr" finds "90-RR-777".
alter table public.assets
  add column identifier_norm text generated always as (upper(regexp_replace(coalesce(identifier, ''), '[^[:alnum:]]', '', 'g'))) stored;

create index assets_identifier_norm_idx on public.assets (tenant_id, identifier_norm);

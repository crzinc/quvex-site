\set QUIET 1
grant all on all tables in schema public to authenticated, anon;
insert into auth.users (id, email) values
 ('11111111-1111-1111-1111-111111111111','ownerA@x.az'),
 ('22222222-2222-2222-2222-222222222222','ownerB@x.az'),
 ('33333333-3333-3333-3333-333333333333','mech@x.az');
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select id as ta from create_tenant('alpha','Alpha','auto_service',null,null,'{}') \gset
insert into clients (tenant_id, name) values (:'ta', 'A client');
insert into catalog_items (tenant_id,kind,name,price,stock) values (:'ta','part','Filtr',10,5) returning id as part \gset
insert into payments (tenant_id,direction,amount) values (:'ta','out',50);
insert into invitations (tenant_id,role,name) values (:'ta','staff','Rəşad') returning token as tok \gset
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select id as tb from create_tenant('beta','Beta','auto_service',null,null,'{}') \gset
insert into clients (tenant_id, name) values (:'tb', 'B client');

\echo '-- isolation: owner B sees only own tenant/clients (expect 1, 1, B client):'
select count(*) as tenants_visible from tenants;
select count(*) as clients_visible from clients;
select name from clients;
do $$ begin insert into clients (tenant_id, name) values ((select id from tenants where slug='alpha' union select '00000000-0000-0000-0000-000000000000'::uuid limit 1), 'x'); raise notice 'FOREIGN INSERT NOT BLOCKED'; exception when others then raise notice 'foreign insert blocked: %', sqlerrm; end $$;

\echo '-- owner A opens own invite: not consumed, no orphan staff (expect alpha, t, 0):'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select accept_invitation(:'tok') as slug;
select accepted_at is null as still_open from invitations;
select count(*) as staff_rows from staff;

\echo '-- mechanic joins; sees order payments only and cannot restock (expect 0, null, 5):'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select accept_invitation(:'tok') as joined;
select count(*) as mech_sees_cashbook from payments;
select restock_catalog_item(:'part', 3) as mech_restock;
select stock from catalog_items;

\echo '-- owner restocks atomically (expect 8, then 0 rows for qty<=0):'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select restock_catalog_item(:'part', 3) as owner_restock;
select restock_catalog_item(:'part', -1) as negative_restock;
select count(*) as owner_sees_cashbook from payments;

\echo '-- policy plan uses InitPlan/SubPlan, not per-row function calls:'
explain (costs off) select * from clients;
reset role;

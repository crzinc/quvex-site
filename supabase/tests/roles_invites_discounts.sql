\set QUIET 1
grant all on all tables in schema public to authenticated, anon;
insert into auth.users (id, email) values
 ('11111111-1111-1111-1111-111111111111','owner@x.az'),
 ('22222222-2222-2222-2222-222222222222','mech@x.az'),
 ('33333333-3333-3333-3333-333333333333','outsider@x.az');
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select slug from create_tenant('servis','Servis','auto_service',null,null,'{}') \gset
insert into catalog_items (tenant_id,kind,name,price,stock) select id,'part','Filtr',10,5 from tenants;
insert into orders (tenant_id,status) select id,'new' from tenants;
insert into order_items (tenant_id,order_id,kind,name,qty,price) select tenant_id,id,'service','Diaq',1,100 from orders;
insert into payments (tenant_id,direction,amount,category) select id,'out',50,'rent' from tenants;
insert into invitations (tenant_id,role,name) select id,'staff','Rəşad' from tenants returning token \gset
\echo '-- owner sets 10% discount:'
update orders set discount_percent=10;
select subtotal,total,debt from orders;

\echo '-- outsider preview + accept:'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select tenant_name, role, valid from invitation_preview(:'token');
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select accept_invitation(:'token') as joined;
\echo '-- reuse of same token must fail:'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
do $$ begin perform accept_invitation((select token from invitations limit 1)); raise notice 'REUSE NOT BLOCKED'; exception when others then raise notice 'reuse blocked: %', sqlerrm; end $$;

\echo '-- mechanic (staff):'
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select count(*) as mech_sees_payments from payments;
insert into order_items (tenant_id,order_id,catalog_item_id,kind,name,qty,price) select o.tenant_id,o.id,c.id,'part','Filtr',2,10 from orders o, catalog_items c;
select stock as stock_after_mech_part from catalog_items;
select subtotal,total from orders;
insert into payments (tenant_id,order_id,amount) select tenant_id,id,30 from orders;
do $$ begin insert into payments (tenant_id,direction,amount) select id,'out',5 from tenants; raise notice 'EXPENSE NOT BLOCKED'; exception when others then raise notice 'expense blocked: %', sqlerrm; end $$;
update catalog_items set price=1;
select price as price_after_mech_update from catalog_items;
delete from orders;
select count(*) as orders_after_mech_delete from orders;
do $$ begin update orders set discount_percent=50; raise notice 'DISCOUNT NOT BLOCKED'; exception when others then raise notice 'discount blocked: %', sqlerrm; end $$;
update orders set status='ready';
select status as mech_status_change from orders;
select count(*) as mech_sees_invites from invitations;
delete from memberships where user_id='11111111-1111-1111-1111-111111111111';
select count(*) as members_after_mech_delete from memberships;

\echo '-- owner:'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select count(*) as owner_sees_payments from payments;
update memberships set role='manager' where user_id='22222222-2222-2222-2222-222222222222';
select role from memberships order by role;
do $$ begin update memberships set role='staff' where user_id='11111111-1111-1111-1111-111111111111'; raise notice 'LAST OWNER NOT GUARDED'; exception when others then raise notice 'last owner guarded: %', sqlerrm; end $$;
delete from memberships where user_id='22222222-2222-2222-2222-222222222222';
select count(*) as members_after_owner_removes from memberships;
reset role;

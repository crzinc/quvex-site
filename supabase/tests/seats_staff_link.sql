\set QUIET 1
grant all on all tables in schema public to authenticated, anon;
insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','owner@x.az','{}'),
 ('22222222-2222-2222-2222-222222222222','m1@x.az','{"full_name":"Rəşad"}'),
 ('33333333-3333-3333-3333-333333333333','m2@x.az','{"full_name":"Elçin"}'),
 ('44444444-4444-4444-4444-444444444444','m3@x.az','{"full_name":"Murad"}');
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select slug from create_tenant('servis','Servis','auto_service',null,null,'{}');
select user_limit as default_limit from tenants;
\echo '-- owner cannot raise own limit:'
update tenants set user_limit = 99;
select user_limit from tenants;
insert into staff (tenant_id, name) select id, 'Rəşad Usta' from tenants returning id as rashad \gset
insert into invitations (tenant_id, role, staff_id) select id, 'staff', :'rashad' from tenants returning token as t1 \gset
insert into invitations (tenant_id, role, name) select id, 'staff', 'Elçin' from tenants returning token as t2 \gset
insert into invitations (tenant_id, role) select id, 'manager' from tenants returning token as t3 \gset
reset role;
\echo '-- admin sets Start (3 seats):'
set request.jwt.claim.sub = '';
update tenants set user_limit = 3, plan = 'start';
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select accept_invitation(:'t1');
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select accept_invitation(:'t2');
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
\echo '-- 4th user must be blocked (expect ERROR: user limit reached):'
\set ON_ERROR_STOP 0
select accept_invitation(:'t3');
\set ON_ERROR_STOP 1
reset role;
select m.role, s.name as linked_staff from memberships m left join staff s on s.id = m.staff_id order by m.role, s.name;
select count(*) as staff_rows from staff;
select (select accepted_at is null from invitations where role='manager') as third_invite_still_open, (select count(*) from memberships) as members;

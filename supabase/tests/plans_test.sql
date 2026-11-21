-- Forfaits Base / Pro / Ultra et choix de l'opérateur (après shop_profile_test, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
reset role;
\echo '--- F1 tarifs de la base : Base 15 000, Pro 25 000, Ultra 50 000'
select plan_monthly_price('essentiel') as base, plan_monthly_price('pro') as pro, plan_monthly_price('business') as ultra;
update subscription_payments set status = 'rejected' where shop_id = '99999999-9999-9999-9999-999999999999' and status in ('contact_pending', 'awaiting_payment', 'declared');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- F2 demande Ultra annuelle par Wave, montant imposé par la base (doit réussir : 500 000)'
insert into subscription_payments (shop_id, plan, annual, method, amount) values ('99999999-9999-9999-9999-999999999999', 'business', true, 'wave', 1);
select plan, annual, method, amount from subscription_payments where shop_id = '99999999-9999-9999-9999-999999999999' and status = 'contact_pending';
\echo '--- F3 le vendeur change d''opérateur après coup (doit échouer)'
update subscription_payments set method = 'orange_money' where shop_id = '99999999-9999-9999-9999-999999999999' and status = 'contact_pending';
\echo '--- F4 opérateur non accepté pour un abonnement (carte, doit échouer)'
reset role; update subscription_payments set status = 'rejected' where status = 'contact_pending'; set role authenticated;
insert into subscription_payments (shop_id, plan, method) values ('99999999-9999-9999-9999-999999999999', 'pro', 'card');
reset role;

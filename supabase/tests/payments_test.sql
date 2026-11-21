-- Scénarios d'attaque sur le paiement des abonnements (à lancer après rls_test.sql, sur la même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1','vendeur2@x');
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a' and not exists (select 1 from profiles where role = 'admin');
insert into shops (id, owner_id, slug, name, category, city, country) values ('77777777-7777-7777-7777-777777777777','00000000-0000-0000-0000-0000000000e1','boutique-e','Boutique E','mode','Bamako','ML');

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- P1 demande de paiement avant autorisation de la boutique (doit échouer)'
insert into subscription_payments (shop_id, plan) values ('77777777-7777-7777-7777-777777777777','pro');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select admin_set_shop_status('77777777-7777-7777-7777-777777777777','approved');
\echo '--- P2 boutique autorisée mais non payée : visible par un visiteur ?'
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
select count(*) as visible_avant_paiement from shops where id = '77777777-7777-7777-7777-777777777777';

reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- P3 demande avec montant truqué à 1 FCFA (le montant doit être recalculé : 12900)'
insert into subscription_payments (id, shop_id, plan, amount, status) values ('88888888-8888-8888-8888-888888888888','77777777-7777-7777-7777-777777777777','pro',1,'confirmed');
select amount, status from subscription_payments where id = '88888888-8888-8888-8888-888888888888';
\echo '--- P4 deuxième demande en parallèle (doit échouer)'
insert into subscription_payments (shop_id, plan) values ('77777777-7777-7777-7777-777777777777','essentiel');
\echo '--- P5 déclarer un paiement SANS avoir contacté l''admin (doit échouer)'
update subscription_payments set status = 'declared', operator_ref = 'OM12345678', payer_phone = '+223 76 00 00 00' where id = '88888888-8888-8888-8888-888888888888';
\echo '--- P6 le vendeur se marque lui-même « contacté » ou « confirmé » (doit échouer)'
update subscription_payments set status = 'awaiting_payment' where id = '88888888-8888-8888-8888-888888888888';
update subscription_payments set status = 'confirmed' where id = '88888888-8888-8888-8888-888888888888';
select admin_mark_contacted('88888888-8888-8888-8888-888888888888');
select admin_confirm_payment('88888888-8888-8888-8888-888888888888');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- P7 l''admin confirme le contact (doit réussir)'
select admin_mark_contacted('88888888-8888-8888-8888-888888888888');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- P8 le vendeur déclare son paiement (doit réussir) puis tente de modifier le montant (doit échouer)'
update subscription_payments set status = 'declared', operator_ref = 'OM12345678', payer_phone = '+223 76 00 00 00' where id = '88888888-8888-8888-8888-888888888888';
update subscription_payments set amount = 1 where id = '88888888-8888-8888-8888-888888888888';
select status, amount from subscription_payments where id = '88888888-8888-8888-8888-888888888888';

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- P9 un pirate lit ou confirme le paiement d''un autre (0 ligne / doit échouer)'
select count(*) as paiements_visibles from subscription_payments;
select admin_confirm_payment('88888888-8888-8888-8888-888888888888');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- P10 l''admin confirme la réception (doit réussir)'
select admin_confirm_payment('88888888-8888-8888-8888-888888888888');
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
select count(*) as visible_apres_paiement from shops where id = '77777777-7777-7777-7777-777777777777';
reset role;
select plan, active, (current_period_end > now() + interval '27 days') as un_mois from subscriptions where shop_id = '77777777-7777-7777-7777-777777777777';
\echo '--- P11 abonnement expiré : la boutique disparaît'
update subscriptions set current_period_end = now() - interval '1 day' where shop_id = '77777777-7777-7777-7777-777777777777';
set role anon;
select count(*) as visible_si_expire from shops where id = '77777777-7777-7777-7777-777777777777';
reset role;

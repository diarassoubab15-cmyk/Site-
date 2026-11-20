\set ON_ERROR_STOP 0
\set QUIET 1
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-00000000000a','admin@x'),
 ('00000000-0000-0000-0000-00000000000b','seller@x'),
 ('00000000-0000-0000-0000-00000000000c','buyer@x'),
 ('00000000-0000-0000-0000-00000000000d','pirate@x');
update profiles set role='admin' where id='00000000-0000-0000-0000-00000000000a';

\echo '--- T1 deuxième admin (doit échouer)'
update profiles set role='admin' where id='00000000-0000-0000-0000-00000000000d';

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- T2 pirate se promeut admin (doit échouer)'
update profiles set role='admin' where id='00000000-0000-0000-0000-00000000000d';

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
insert into shops (id, owner_id, slug, name, category, city, country) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000000b','boutique-b','Boutique B','mode','Dakar','SN');
\echo '--- T3 vendeur s''autorise lui-même (doit échouer)'
update shops set status='approved' where id='11111111-1111-1111-1111-111111111111';
\echo '--- T4 vendeur ajoute un produit avant autorisation (doit échouer)'
insert into products (shop_id, slug, name, category, price, stock) values ('11111111-1111-1111-1111-111111111111','robe-test','Robe','mode',10000,5);
insert into payout_accounts (shop_id, type, provider_token, last4) values ('11111111-1111-1111-1111-111111111111','wave','tok_x','4567');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- T5 admin autorise (doit réussir)'
select admin_set_shop_status('11111111-1111-1111-1111-111111111111','approved','ok');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
insert into products (id, shop_id, slug, name, category, price, stock, wholesale_min, wholesale_price) values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','robe-test','Robe','mode',10000,5,3,8000);
\echo '--- T5b produits visibles :'
select count(*) as produits_vendeur from products;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000c',false);
\echo '--- T6 acheteur commande avec un total truqué à 1 FCFA'
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city)
 values ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-00000000000c','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',3,1,'cash_on_delivery','C','+221','Dakar');
select total as total_enregistre from orders;
\echo '--- T7 avis avant livraison (doit échouer)'
insert into reviews (order_id, product_id, author_id, rating, title, body) values ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000000c',5,'Top','Très bien');
\echo '--- T8 acheteur modifie le total ou marque "remboursée" lui-même (doit échouer)'
update orders set total=5 where id='33333333-3333-3333-3333-333333333333';
update orders set status='refunded' where id='33333333-3333-3333-3333-333333333333';
\echo '--- T9 acheteur confirme la réception puis avis (doit réussir)'
update orders set status='delivered' where id='33333333-3333-3333-3333-333333333333';
insert into reviews (order_id, product_id, author_id, rating, title, body) values ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-00000000000c',5,'Top','Très bien');
select count(*) as avis from reviews;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- T10 pirate : commandes, comptes de paiement, profils visibles (tout doit être 0)'
select (select count(*) from orders) as commandes, (select count(*) from payout_accounts) as comptes, (select count(*) from profiles where id <> auth.uid()) as autres_profils;
\echo '--- T11 pirate ferme la boutique d''un autre (doit échouer)'
select close_my_shop('11111111-1111-1111-1111-111111111111', true, true, false);
\echo '--- T12 pirate change le statut via admin_set_shop_status (doit échouer)'
select admin_set_shop_status('11111111-1111-1111-1111-111111111111','suspended');

reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- T13 visiteur anonyme : produits visibles / commandes visibles'
select (select count(*) from products) as produits, (select count(*) from orders) as commandes;

reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
\echo '--- T14 vendeur ferme sa boutique en supprimant ses comptes'
select close_my_shop('11111111-1111-1111-1111-111111111111', true, true, true);
select (select status from shops) as statut, (select count(*) from payout_accounts) as comptes_restants;

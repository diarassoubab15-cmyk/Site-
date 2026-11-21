-- Essayage virtuel : quotas d'essais, vêtements de la boutique seulement (après plans_test, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
reset role;
-- Un vêtement publié dans la boutique F (en ligne) et un produit d'une autre catégorie.
insert into products (id, shop_id, slug, name, category, price, stock, published) values
  ('cccccccc-0000-4000-8000-000000000001','99999999-9999-9999-9999-999999999999','robe-test-tryon','Robe test','mode',18000,5,true),
  ('cccccccc-0000-4000-8000-000000000002','99999999-9999-9999-9999-999999999999','lampe-test-tryon','Lampe test','maison',9000,5,true)
  on conflict do nothing;
update subscriptions set plan = 'essentiel' where shop_id = '99999999-9999-9999-9999-999999999999';
set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- T1 visiteur non connecté : réserver un essai (doit échouer)'
select claim_tryon('99999999-9999-9999-9999-999999999999', array['cccccccc-0000-4000-8000-000000000001']::uuid[]);
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- T2 client : produit d''une autre catégorie (doit échouer)'
select claim_tryon('99999999-9999-9999-9999-999999999999', array['cccccccc-0000-4000-8000-000000000002']::uuid[]);
\echo '--- T3 client : forfait Base, 5 essais acceptés puis le 6e refusé'
select count(claim_tryon('99999999-9999-9999-9999-999999999999', array['cccccccc-0000-4000-8000-000000000001']::uuid[])) as reserves from generate_series(1,5);
select claim_tryon('99999999-9999-9999-9999-999999999999', array['cccccccc-0000-4000-8000-000000000001']::uuid[]);
select tryon_remaining('99999999-9999-9999-9999-999999999999') as restants;
\echo '--- T4 un essai raté est rendu (restants passe à 1)'
select finish_tryon((select id from tryons where status = 'pending' limit 1), false);
select tryon_remaining('99999999-9999-9999-9999-999999999999') as restants_apres_echec;
\echo '--- T5 le client écrit directement dans la table ou se remet à zéro (2 échecs ou 0 ligne)'
insert into tryons (user_id, shop_id, product_ids) values (auth.uid(), '99999999-9999-9999-9999-999999999999', array['cccccccc-0000-4000-8000-000000000001']::uuid[]);
delete from tryons;
reset role; select count(*) as essais_conserves from tryons where user_id = '00000000-0000-0000-0000-00000000000d'; set role authenticated;
\echo '--- T6 forfait Pro : 15 au total ; Ultra : illimité (null)'
reset role; update subscriptions set plan = 'pro' where shop_id = '99999999-9999-9999-9999-999999999999'; set role authenticated;
select tryon_remaining('99999999-9999-9999-9999-999999999999') as restants_pro;
reset role; update subscriptions set plan = 'business' where shop_id = '99999999-9999-9999-9999-999999999999'; set role authenticated;
select tryon_remaining('99999999-9999-9999-9999-999999999999') is null as illimite_ultra;
\echo '--- T7 un autre client ne voit pas les essais des autres (0)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
select count(*) as essais_visibles from tryons;
reset role;

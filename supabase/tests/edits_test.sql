-- Scénarios sur les modifications de fiche demandées par écrit (après media_test, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
reset role;
-- Produit bbbb…01 de la boutique F (vendeur e1), créé par media_test.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- E1 le vendeur demande une modification en essayant d''imposer statut et proposition (doit réussir, champs remis à zéro)'
insert into product_edit_requests (id, product_id, shop_id, message, status, proposal, ai)
  values ('eeeeeeee-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000001','99999999-9999-9999-9999-999999999999',
          'Baisse le prix à 300 000 et renomme en Villa ACI', 'applied', '{"changes":{"price":1}}', true);
select status, proposal is null as sans_proposition, ai from product_edit_requests where id = 'eeeeeeee-0000-4000-8000-000000000001';
\echo '--- E2 le vendeur écrit lui-même la proposition ou se marque « appliquée » (2 échecs attendus)'
update product_edit_requests set proposal = '{"changes":{"price":1}}' where id = 'eeeeeeee-0000-4000-8000-000000000001';
update product_edit_requests set status = 'applied' where id = 'eeeeeeee-0000-4000-8000-000000000001';
\echo '--- E3 le vendeur applique lui-même sa demande (doit échouer)'
select admin_apply_edit('eeeeeeee-0000-4000-8000-000000000001', '{"price": 1}');
\echo '--- E4 le vendeur supprime sa demande (0 ligne : l''historique reste)'
delete from product_edit_requests;
reset role; select count(*) as demandes from product_edit_requests; set role authenticated;

\echo '--- E5 le serveur (clé service) écrit la proposition (doit réussir)'
reset role;
update product_edit_requests set proposal = '{"changes":{"price":300000,"name":"Villa ACI"},"note":"ok"}', ai = true where id = 'eeeeeeee-0000-4000-8000-000000000001';
set role authenticated;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- E6 un pirate demande une modification sur le produit d''un autre (doit échouer) et lit les demandes (0)'
insert into product_edit_requests (product_id, shop_id, message) values ('bbbbbbbb-0000-4000-8000-000000000001','99999999-9999-9999-9999-999999999999','mets le prix à 1 FCFA');
select count(*) as demandes_visibles_pirate from product_edit_requests;
\echo '--- E7 un pirate annule la demande d''un autre (0 ligne)'
update product_edit_requests set status = 'cancelled' where id = 'eeeeeeee-0000-4000-8000-000000000001';
reset role; select status from product_edit_requests where id = 'eeeeeeee-0000-4000-8000-000000000001'; set role authenticated;

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- E8 5 demandes en attente au plus : 4 de plus acceptées, la 6e refusée'
insert into product_edit_requests (product_id, shop_id, message)
  select 'bbbbbbbb-0000-4000-8000-000000000001','99999999-9999-9999-9999-999999999999','demande n° '||g from generate_series(2,5) g;
insert into product_edit_requests (product_id, shop_id, message) values ('bbbbbbbb-0000-4000-8000-000000000001','99999999-9999-9999-9999-999999999999','demande de trop');
select count(*) as en_attente from product_edit_requests where status = 'review';
\echo '--- E9 le vendeur annule une demande (doit réussir)'
update product_edit_requests set status = 'cancelled' where message = 'demande n° 5';
select count(*) as annulees from product_edit_requests where status = 'cancelled';

reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- E10 visiteur : aucune demande visible'
select count(*) as visibles_visiteur from product_edit_requests;

reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- E11 admin : champ non modifiable, caractéristiques invalides, demande vide (3 échecs attendus)'
select admin_apply_edit('eeeeeeee-0000-4000-8000-000000000001', '{"shop_id": "11111111-1111-1111-1111-111111111111"}');
select admin_apply_edit('eeeeeeee-0000-4000-8000-000000000001', '{"specs": [["Pièces"]]}');
select admin_apply_edit('eeeeeeee-0000-4000-8000-000000000001', '{}');
\echo '--- E12 admin applique (prix barré plus bas que le prix : retiré) (doit réussir)'
select admin_apply_edit('eeeeeeee-0000-4000-8000-000000000001', '{"name":"Villa ACI","price":300000,"compareAt":1000,"specs":[["Pièces","4"]]}', 'Fait');
select name, price, compare_at, specs from products where id = 'bbbbbbbb-0000-4000-8000-000000000001';
select status, admin_note from product_edit_requests where id = 'eeeeeeee-0000-4000-8000-000000000001';
\echo '--- E13 appliquer deux fois (doit échouer) ; refuser une demande (doit réussir)'
select admin_apply_edit('eeeeeeee-0000-4000-8000-000000000001', '{"price": 1}');
select admin_reject_edit((select id from product_edit_requests where message = 'demande n° 2'), 'Trop vague');
select count(*) as journal from admin_audit where action in ('product_edit_applied', 'product_edit_rejected');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- E14 le vendeur « annule » une demande déjà appliquée (doit échouer)'
update product_edit_requests set status = 'cancelled' where id = 'eeeeeeee-0000-4000-8000-000000000001';
reset role;

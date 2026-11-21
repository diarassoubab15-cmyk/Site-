-- Scénarios sur les produits et leurs médias (après les autres tests, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
reset role;
-- Boutique F : autorisée et en ligne (abonnement Pro de videos_test). Boutique 1 (rls_test) : fermée.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- M1 le vendeur crée un bien immobilier (doit réussir)'
insert into products (id, shop_id, slug, name, category, price, price_unit, stock, published)
  values ('bbbbbbbb-0000-4000-8000-000000000001','99999999-9999-9999-9999-999999999999','villa-aci-2000','Villa ACI 2000','immobilier',350000,'mois',1,true);
select name, price_unit from products where id = 'bbbbbbbb-0000-4000-8000-000000000001';
\echo '--- M2 photo rangée dans le dossier d''une autre boutique (doit échouer)'
insert into product_media (product_id, kind, path) values ('bbbbbbbb-0000-4000-8000-000000000001','photo','11111111-1111-1111-1111-111111111111/x.webp');
\echo '--- M3 le vendeur dépose un modèle 3D ou une image marquée IA (doit échouer)'
insert into product_media (product_id, kind, path) values ('bbbbbbbb-0000-4000-8000-000000000001','model3d','99999999-9999-9999-9999-999999999999/m.glb');
insert into product_media (product_id, kind, path, ai_generated) values ('bbbbbbbb-0000-4000-8000-000000000001','photo','99999999-9999-9999-9999-999999999999/a.webp', true);
\echo '--- M4 12 photos acceptées, la 13e refusée'
insert into product_media (product_id, kind, path, position) select 'bbbbbbbb-0000-4000-8000-000000000001','photo','99999999-9999-9999-9999-999999999999/p'||g||'.webp', g from generate_series(1,12) g;
insert into product_media (product_id, kind, path) values ('bbbbbbbb-0000-4000-8000-000000000001','photo','99999999-9999-9999-9999-999999999999/p13.webp');
select count(*) as photos from product_media where kind = 'photo';
\echo '--- M5 panoramas 360 avec nom de pièce (doit réussir)'
insert into product_media (product_id, kind, path, label, position) values
  ('bbbbbbbb-0000-4000-8000-000000000001','pano','99999999-9999-9999-9999-999999999999/salon.jpg','Salon',0),
  ('bbbbbbbb-0000-4000-8000-000000000001','pano','99999999-9999-9999-9999-999999999999/chambre.jpg','Chambre',1);
\echo '--- M6 le vendeur change le fichier d''un média (doit échouer) puis réordonne (doit réussir)'
update product_media set path = '11111111-1111-1111-1111-111111111111/vol.jpg' where label = 'Salon';
update product_media set position = 5, label = 'Grand salon' where label = 'Salon';
select label, position from product_media where kind = 'pano' order by position;
\echo '--- M7 le vendeur déplace son produit vers une autre boutique (doit échouer)'
update products set shop_id = '77777777-7777-7777-7777-777777777777' where id = 'bbbbbbbb-0000-4000-8000-000000000001';

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- M8 un pirate ajoute une photo au produit d''un autre (doit échouer)'
insert into product_media (product_id, kind, path) values ('bbbbbbbb-0000-4000-8000-000000000001','pano','99999999-9999-9999-9999-999999999999/pirate.jpg');
\echo '--- M9 un pirate supprime les médias d''un autre (0 ligne supprimée)'
delete from product_media where product_id = 'bbbbbbbb-0000-4000-8000-000000000001';
reset role; select count(*) as medias_restants from product_media; set role authenticated;

reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- M10 visiteur : médias visibles (produit publié, boutique en ligne) = 14 ; après dépublication = 0'
select count(*) as visibles from product_media;
reset role; update products set published = false where id = 'bbbbbbbb-0000-4000-8000-000000000001'; set role anon;
select count(*) as visibles_apres_depublication from product_media;
reset role;

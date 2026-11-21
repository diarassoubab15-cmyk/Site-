-- Scénarios sur la fiche publique des boutiques et la confidentialité du responsable (après edits_test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
-- Le test rejoue les droits de la migration 0009 (le « grant all » ci-dessus les annule pour les besoins des autres tests).
revoke select on shops from anon, authenticated;
grant select (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, status_reason, status_changed_at,
              created_at, response_time, payments, district, is_physical, maps_url, lat, lng, whatsapp, call_phone, sample_prices)
  on shops to anon, authenticated;
reset role;
update shops set owner_name = 'Responsable F', contact_email = 'f@x', contact_phone = '+22370000000' where id = '99999999-9999-9999-9999-999999999999';

set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- S1 visiteur : lit l''e-mail du responsable (doit échouer)'
select contact_email from shops limit 1;
\echo '--- S2 visiteur : lit la fiche publique (doit réussir)'
select name, city from shops where id = '99999999-9999-9999-9999-999999999999';
\echo '--- S3 visiteur : appelle la fonction des coordonnées (0 ligne)'
select * from admin_shop_contacts();

reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- S4 utilisateur connecté : lit le téléphone du responsable (doit échouer) ; fonction réservée : 0 ligne'
select contact_phone from shops limit 1;
select count(*) as coordonnees_visibles from admin_shop_contacts();

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- S5 admin : obtient les coordonnées par la fonction (doit réussir)'
select owner_name, contact_email from admin_shop_contacts() where id = '99999999-9999-9999-9999-999999999999';

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- S6 vendeur : lien « Google Maps » qui pointe ailleurs (2 échecs attendus)'
update shops set is_physical = true, maps_url = 'https://evil.example/maps' where id = '99999999-9999-9999-9999-999999999999';
update shops set is_physical = true, maps_url = 'javascript:alert(1)' where id = '99999999-9999-9999-9999-999999999999';
\echo '--- S7 vendeur : carte sur une boutique non physique (doit échouer)'
update shops set is_physical = false, maps_url = 'https://maps.app.goo.gl/abc' where id = '99999999-9999-9999-9999-999999999999';
\echo '--- S8 vendeur : prix invalides (6 produits, prix négatif, prix à virgule, texte) : 4 échecs attendus'
update shops set sample_prices = (select jsonb_agg(jsonb_build_object('name', 'p'||g, 'price', 100)) from generate_series(1,6) g) where id = '99999999-9999-9999-9999-999999999999';
update shops set sample_prices = '[{"name":"x","price":-5}]' where id = '99999999-9999-9999-9999-999999999999';
update shops set sample_prices = '[{"name":"x","price":10.5}]' where id = '99999999-9999-9999-9999-999999999999';
update shops set sample_prices = '[{"name":"x","price":"cher"}]' where id = '99999999-9999-9999-9999-999999999999';
\echo '--- S9 vendeur : WhatsApp invalide, latitude sans longitude (2 échecs attendus)'
update shops set whatsapp = '<script>' where id = '99999999-9999-9999-9999-999999999999';
update shops set is_physical = true, lat = 12.6 where id = '99999999-9999-9999-9999-999999999999';
\echo '--- S10 vendeur : fiche complète valide (doit réussir)'
update shops set district = 'ACI 2000', is_physical = true, maps_url = 'https://www.google.com/maps?q=12.6392,-8.0029', lat = 12.6392, lng = -8.0029,
  whatsapp = '+223 70 00 00 00', call_phone = '+223 76 00 00 00', sample_prices = '[{"name":"Robe wax","price":18500}]'
  where id = '99999999-9999-9999-9999-999999999999';
select district, is_physical, lat, lng, whatsapp, sample_prices from shops where id = '99999999-9999-9999-9999-999999999999';
\echo '--- S11 autre vendeur : modifie la fiche d''une autre boutique (0 ligne)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
update shops set whatsapp = '+000 00000000' where id = '99999999-9999-9999-9999-999999999999';
reset role;
select whatsapp as whatsapp_inchange from shops where id = '99999999-9999-9999-9999-999999999999';

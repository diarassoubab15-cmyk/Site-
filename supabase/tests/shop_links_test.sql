-- Liens de boutique : adresse personnalisée, anciennes adresses qui redirigent (après ai_studio_test).
\set ON_ERROR_STOP 0
\set QUIET 1
reset role;
delete from shop_aliases;
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- L1 adresse invalide, réservée, déjà prise par une autre boutique (3 erreurs)'
select set_shop_slug('Bazin Bamako!');
select set_shop_slug('admin');
reset role; select slug as autre from shops where owner_id <> '00000000-0000-0000-0000-0000000000e1' limit 1 \gset
set role authenticated; select set_shop_slug(:'autre');
\echo '--- L2 nouvelle adresse acceptée ; l''ancienne redirige vers la nouvelle'
reset role; select slug as ancien from shops where owner_id = '00000000-0000-0000-0000-0000000000e1' and status <> 'closed' order by created_at desc limit 1 \gset
set role authenticated;
select set_shop_slug('bazin-bamako') as nouvelle;
select resolve_shop_slug(:'ancien') = 'bazin-bamako' as ancien_lien_redirige;
\echo '--- L3 visiteur : résout, mais ne peut ni lire la table ni changer d''adresse (2 erreurs puis true)'
set role anon; select set_config('request.jwt.claim.sub','',false);
select * from shop_aliases;
select set_shop_slug('vol-de-lien');
select resolve_shop_slug(:'ancien') is not null as resolu_par_visiteur;
\echo '--- L4 une autre boutique ne peut pas prendre une ancienne adresse (erreur)'
reset role;
insert into shops (owner_id, slug, name, category, city, country) values ('00000000-0000-0000-0000-00000000000d', 'test-liens-autre', 'Autre', 'mode', 'Bamako', 'Mali') on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select set_shop_slug(:'ancien');
\echo '--- L5 au plus 3 changements par mois (le 4e échoue)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
select set_shop_slug('bazin-bamako-2'); select set_shop_slug('bazin-bamako-3');
select set_shop_slug('bazin-bamako-4');
reset role;

-- Scénarios sur les vidéos de boutique (après rls_test, payments_test et rewards_test, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
reset role;
-- Boutique F (rewards_test) : autorisée mais sans abonnement → hors ligne.
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- V1 demande de vidéo pour une boutique hors ligne (doit échouer)'
insert into shop_videos (shop_id, description) values ('99999999-9999-9999-9999-999999999999','Agence immobilière à Bamako : villas, terrains et appartements.');

reset role;
insert into subscriptions (shop_id, plan, active, current_period_end) values ('99999999-9999-9999-9999-999999999999','essentiel',true, now() + interval '1 month')
  on conflict (shop_id) do update set plan = 'essentiel', active = true, current_period_end = now() + interval '1 month';
set role authenticated;
\echo '--- V2 demande valide, en essayant d''imposer statut, script et vidéo (le statut doit rester queued, le reste vide)'
insert into shop_videos (id, shop_id, description, status, script, video_path, is_active)
  values ('aaaaaaaa-0000-4000-8000-000000000001','99999999-9999-9999-9999-999999999999','Agence immobilière à Bamako : villas, terrains et appartements.','approved','{"x":1}','pirate.mp4',true);
select status, script is null as script_vide, video_path is null as video_vide, is_active from shop_videos where id = 'aaaaaaaa-0000-4000-8000-000000000001';
\echo '--- V3 deuxième demande pendant une fabrication en cours (doit échouer : quota ou fabrication en cours)'
insert into shop_videos (shop_id, description) values ('99999999-9999-9999-9999-999999999999','Deuxième demande pendant la première, refusée.');
\echo '--- V4 le vendeur publie lui-même sa vidéo (doit échouer)'
update shop_videos set status = 'approved', is_active = true where id = 'aaaaaaaa-0000-4000-8000-000000000001';
\echo '--- V5 le vendeur se sert de la fonction du programme de fabrication (doit échouer)'
select * from claim_next_video();
\echo '--- V6 le vendeur valide sa vidéo via la fonction admin (doit échouer)'
select admin_review_video('aaaaaaaa-0000-4000-8000-000000000001', true);

\echo '--- V7 le programme de fabrication (clé serveur) prend la demande puis la dépose'
reset role;
select ref is not null as pris, status from claim_next_video();
update shop_videos set status = 'review', video_path = '99999999/aaaa.mp4', poster_path = '99999999/aaaa.jpg', script = '{"headline":"Test"}', rendered_at = now() where id = 'aaaaaaaa-0000-4000-8000-000000000001';

set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- V8 visiteur : vidéo visible avant validation ? (0 attendu)'
select count(*) as visibles from shop_videos;

reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- V9 l''admin valide (doit réussir)'
select admin_review_video('aaaaaaaa-0000-4000-8000-000000000001', true, 'Très bien');
reset role; set role anon;
select count(*) as visibles_apres_validation from shop_videos;

reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- V10 forfait Essentiel : 2e vidéo du mois (doit échouer : quota 1)'
insert into shop_videos (shop_id, description) values ('99999999-9999-9999-9999-999999999999','Encore une vidéo ce mois-ci, au-delà du quota.');

reset role; update subscriptions set plan = 'pro' where shop_id = '99999999-9999-9999-9999-999999999999'; set role authenticated;
\echo '--- V11 forfait Pro : nouvelle demande puis annulation par le vendeur (doit réussir)'
insert into shop_videos (id, shop_id, description) values ('aaaaaaaa-0000-4000-8000-000000000002','99999999-9999-9999-9999-999999999999','Nouvelle vidéo autorisée par le forfait Pro.');
update shop_videos set status = 'cancelled' where id = 'aaaaaaaa-0000-4000-8000-000000000002';
select status from shop_videos where id = 'aaaaaaaa-0000-4000-8000-000000000002';

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- V12 un pirate : seules les vidéos validées et publiées sont visibles (1 attendu), et il ne peut rien demander pour la boutique d''un autre'
select count(*) as visibles from shop_videos;
insert into shop_videos (shop_id, description) values ('99999999-9999-9999-9999-999999999999','Je commande une vidéo pour la boutique d''un autre.');
reset role;

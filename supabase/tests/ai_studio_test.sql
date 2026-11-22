-- Studio IA (forfait Ultra) : quotas mensuels, boutique du vendeur seulement, publication (après featured_test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
revoke all on ai_creations from anon, authenticated; grant select on ai_creations to anon, authenticated;
reset role;
update subscriptions set plan = 'pro' where shop_id in ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777');
set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- A1 visiteur : réserver une création (doit échouer)'
select claim_ai_creation('image', 'Une robe en wax au soleil');
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- A2 vendeur en forfait Pro : refusé (0 restant, puis erreur)'
select ai_remaining('image') as restants_pro;
select claim_ai_creation('image', 'Une robe en wax au soleil');
reset role; update subscriptions set plan = 'business' where shop_id in ('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777'); set role authenticated;
\echo '--- A3 Ultra : 30 images et 4 vidéos par mois, la 5e vidéo refusée'
select ai_remaining('image') as images, ai_remaining('video') as videos;
select count(claim_ai_creation('video', 'Plan large de la boutique')) as videos_reservees from generate_series(1,4);
select claim_ai_creation('video', 'Une de trop');
\echo '--- A4 une création ratée est rendue (videos passe à 1)'
reset role; update ai_creations set status = 'failed' where id = (select id from ai_creations where kind = 'video' limit 1); set role authenticated;
select ai_remaining('video') as videos_apres_echec;
\echo '--- A5 écriture directe ou suppression par le vendeur (2 échecs)'
insert into ai_creations (shop_id, kind, prompt) values (my_shop(), 'image', 'triche');
update ai_creations set status = 'done', path = 'x.jpg';
\echo '--- A6 prompt trop court, image de départ d''une autre boutique (2 échecs)'
select claim_ai_creation('image', 'ab');
select claim_ai_creation('video', 'Animer', gen_random_uuid());
\echo '--- A7 publication : refusée tant que pas terminée, acceptée après ; visible du public (1)'
select claim_ai_creation('image', 'Façade de la boutique au soleil couchant') as img \gset
select set_ai_published(:'img', true);
reset role; update ai_creations set status = 'done', path = 'p/x.jpg' where id = :'img'; set role authenticated;
select set_ai_published(:'img', true);
set role anon; select set_config('request.jwt.claim.sub','',false); select count(*) as publiees_visibles from ai_creations; reset role;
\echo '--- A8 un autre utilisateur ne peut pas publier ni voir les brouillons (erreur puis 1)'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
select set_ai_published(:'img', false);
select count(*) as visibles_pour_autre from ai_creations;
reset role;

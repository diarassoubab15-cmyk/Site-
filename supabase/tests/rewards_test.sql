-- Scénarios sur les récompenses (après rls_test.sql et payments_test.sql, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant all on all tables in schema public to anon, authenticated;
reset role;
-- la boutique E (payments_test) a un abonnement expiré : elle n'est plus en ligne
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- R1 un vendeur s''offre des mois via la fonction admin (doit échouer)'
select admin_grant_reward('77777777-7777-7777-7777-777777777777','gift','gift','Cadeau',12);
\echo '--- R2 un vendeur écrit directement dans la table des récompenses (doit échouer)'
insert into rewards (shop_id, kind, period_key, title, free_months, starts_on, ends_on) values ('77777777-7777-7777-7777-777777777777','gift','gift','Cadeau',12,current_date,current_date + 365);
\echo '--- R3 un vendeur consulte le classement de toutes les boutiques (doit échouer)'
select count(*) from admin_seller_ranking(now() - interval '1 year', now());
\echo '--- R4 statistiques du vendeur : seulement les siennes'
select delivered, revenue, rank, competitors from seller_my_stats(now() - interval '1 year', now() + interval '1 day');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- R5 l''admin voit le classement (doit réussir)'
select shop_name, delivered, revenue from admin_seller_ranking(now() - interval '1 year', now() + interval '1 day') limit 3;
\echo '--- R6 l''admin offre JANVIER 2027 (mois choisi) : la boutique reste hors ligne aujourd''hui'
select admin_grant_reward('77777777-7777-7777-7777-777777777777','month','2026-12','Meilleur vendeur de décembre 2026',1,'2027-01-01') is not null as accorde;
select shop_is_live('77777777-7777-7777-7777-777777777777') as en_ligne_aujourdhui, starts_on, ends_on from rewards where period_key = '2026-12';
\echo '--- R7 un deuxième gagnant pour la même période (doit échouer)'
reset role;
insert into shops (id, owner_id, slug, name, category, city, country, status) values ('99999999-9999-9999-9999-999999999999','00000000-0000-0000-0000-0000000000e1','boutique-f','Boutique F','mode','Kayes','ML','approved');
set role authenticated;
select admin_grant_reward('99999999-9999-9999-9999-999999999999','month','2026-12','Doublon',1);
\echo '--- R8 l''admin offre 2 mois « à la suite » : la boutique repasse en ligne tout de suite'
select admin_grant_reward('77777777-7777-7777-7777-777777777777','gift','gift','Geste commercial',2) is not null as accorde;
select shop_is_live('77777777-7777-7777-7777-777777777777') as en_ligne, shop_covered_until('77777777-7777-7777-7777-777777777777')::date as couvert_jusquau;

reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- R9 un visiteur voit le badge public, pas le cadeau privé'
select kind, title from rewards order by kind;

reset role; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- R10 le vendeur tente de modifier ou supprimer sa récompense (0 ligne touchée)'
update rewards set free_months = 12 where shop_id = '77777777-7777-7777-7777-777777777777';
delete from rewards where shop_id = '77777777-7777-7777-7777-777777777777';
select count(*) as recompenses_intactes, max(free_months) as max_mois from rewards where shop_id = '77777777-7777-7777-7777-777777777777';

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- R11 l''admin retire le cadeau : la boutique repasse hors ligne'
select admin_revoke_reward((select id from rewards where kind = 'gift'));
select shop_is_live('77777777-7777-7777-7777-777777777777') as en_ligne;
reset role;

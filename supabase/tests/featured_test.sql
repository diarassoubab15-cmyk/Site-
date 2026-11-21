-- « À la une » (après theme_test, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
reset role;
update subscriptions set plan = 'business' where shop_id = '99999999-9999-9999-9999-999999999999';
set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- U1 visiteur : la boutique Ultra en ligne est à la une (doit apparaître)'
select slug, name, category from featured_shops(null, 3, '2026-47');
\echo '--- U2 même semaine, même ordre pour tout le monde ; autre catégorie : 0'
select (select string_agg(slug, ',') from featured_shops(null, 12, '2026-47')) = (select string_agg(slug, ',') from featured_shops(null, 12, '2026-47')) as ordre_stable;
select count(*) as autre_categorie from featured_shops('automobile', 3, '2026-47');
reset role; update subscriptions set plan = 'pro' where shop_id = '99999999-9999-9999-9999-999999999999'; set role anon;
\echo '--- U3 la boutique passe en Pro : elle n''est plus à la une (0)'
select count(*) as a_la_une from featured_shops(null, 12, '2026-47') where name = 'Boutique F';
reset role; update subscriptions set plan = 'business' where shop_id = '99999999-9999-9999-9999-999999999999';
update shops set status = 'suspended' where id = '99999999-9999-9999-9999-999999999999'; set role anon;
\echo '--- U4 boutique Ultra suspendue par l''admin : jamais à la une (0)'
select count(*) as a_la_une from featured_shops(null, 12, '2026-47') where name = 'Boutique F';
reset role; update shops set status = 'approved' where id = '99999999-9999-9999-9999-999999999999';

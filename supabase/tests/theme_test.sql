-- Apparence des boutiques (après tryon_test, même base de test).
\set ON_ERROR_STOP 0
\set QUIET 1
grant select (brand_color, signature, display_font) on shops to anon, authenticated;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',false);
\echo '--- A1 couleur hors palette, animation inconnue, police inconnue (3 échecs attendus)'
update shops set brand_color = '#000001' where id = '99999999-9999-9999-9999-999999999999';
update shops set signature = 'feu' where id = '99999999-9999-9999-9999-999999999999';
update shops set display_font = 'comic' where id = '99999999-9999-9999-9999-999999999999';
\echo '--- A2 apparence valide (doit réussir)'
update shops set brand_color = '#22d3ee', signature = 'constellation', display_font = 'sans' where id = '99999999-9999-9999-9999-999999999999';
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000d',false);
\echo '--- A3 un autre compte change l''apparence (0 ligne)'
update shops set brand_color = '#ff6b6b' where id = '99999999-9999-9999-9999-999999999999';
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
\echo '--- A4 visiteur : lit l''apparence publique (turquoise / constellation / sans)'
select brand_color, signature, display_font from shops where id = '99999999-9999-9999-9999-999999999999';
reset role;

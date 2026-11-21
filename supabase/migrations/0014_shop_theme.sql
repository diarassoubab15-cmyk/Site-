-- NEXORA · apparence des boutiques : couleur de marque (Pro et Ultra), animation signature et police (Ultra).
-- Choix dans des listes fermées : couleurs vives lisibles sur fond noir, animations et polices prévues par NEXORA.
-- Le vendeur peut régler son apparence à tout moment ; elle ne s'affiche que si son forfait l'inclut.
alter table shops
  add column brand_color  text check (brand_color in ('#ff5fa2', '#ff6b6b', '#ff9f43', '#e3b341', '#84cc16', '#3ad389', '#22d3ee', '#3b9eff', '#9281f7', '#e879f9')),
  add column signature    text check (signature in ('vague', 'constellation', 'ruban', 'pulsation')),
  add column display_font text check (display_font in ('serif', 'sans', 'mono'));

-- Colonnes publiques (la lecture des boutiques se fait colonne par colonne depuis la migration 0009).
grant select (brand_color, signature, display_font) on shops to anon, authenticated;

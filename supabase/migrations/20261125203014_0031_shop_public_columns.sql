-- Colonnes publiques ajoutées depuis 0009 : la table shops n'est lisible que colonne par colonne
-- (les coordonnées privées du responsable restent fermées). Sans ce droit, les pages publiques échouent.
grant select (verified_at, ship_days, return_policy, fb_pixel_id, tiktok_pixel_id) on shops to anon, authenticated;

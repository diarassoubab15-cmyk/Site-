-- NEXORA · forfait public d'une boutique en ligne (Base / Pro / Ultra), pour activer ses fonctions sur les pages publiques
-- (ex. présentation animée des produits en Ultra). Ne révèle rien d'autre de l'abonnement (dates, paiements).
create or replace function shop_tier(p_slug text) returns plan_id
language sql stable security definer set search_path = public as $$
  select sub.plan from shops s join subscriptions sub on sub.shop_id = s.id
  where s.slug = p_slug and s.status = 'approved' and shop_is_live(s.id);
$$;
grant execute on function shop_tier(text) to anon, authenticated;

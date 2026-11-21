-- NEXORA · « À la une » : boutiques Ultra en ligne mises en avant, renouvelées chaque semaine (lundi).
-- Rotation équitable et identique pour tous : ordre tiré d'une empreinte (boutique + semaine ISO), sans choix manuel.
-- Seules des informations publiques sont renvoyées ; l'abonnement lui-même reste privé.
create or replace function featured_shops(p_category text default null, p_limit integer default 3, p_week text default null)
returns table (slug text, name text, city text, country text, category text, brand_color text)
language sql stable security definer set search_path = public as $$
  select s.slug, s.name, s.city, s.country, s.category, s.brand_color
  from shops s join subscriptions sub on sub.shop_id = s.id
  where sub.plan = 'business' and s.status = 'approved' and shop_is_live(s.id)
    and (p_category is null or s.category = p_category)
  order by md5(s.id::text || coalesce(p_week, to_char(now() at time zone 'utc', 'IYYY-IW')))
  limit least(greatest(p_limit, 1), 12);
$$;
grant execute on function featured_shops(text, integer, text) to anon, authenticated;

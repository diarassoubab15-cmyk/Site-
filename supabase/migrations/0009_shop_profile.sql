-- NEXORA · fiche publique des boutiques (adresse, Google Maps, WhatsApp, appel direct, quelques prix)
--         et confidentialité des coordonnées du responsable.

-- ------------------------------------------------------------------ 1. confidentialité
-- Avant : nom, e-mail et téléphone du responsable étaient lisibles par tout le monde via l'API publique
-- (la RLS filtre les LIGNES, pas les colonnes). Désormais, seules les colonnes publiques sont lisibles ;
-- l'administrateur obtient les coordonnées par une fonction réservée.

-- ------------------------------------------------------------------ 2. nouvelles informations publiques
create or replace function valid_sample_prices(p jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(p) = 'array' and jsonb_array_length(p) <= 5
     and not exists (
       select 1 from jsonb_array_elements(p) e
       where jsonb_typeof(e) <> 'object'
          or char_length(coalesce(e->>'name', '')) not between 1 and 60
          or jsonb_typeof(e->'price') <> 'number'
          or (e->>'price')::numeric <= 0 or (e->>'price')::numeric > 1000000000
          or (e->>'price')::numeric <> trunc((e->>'price')::numeric));
$$;

alter table shops
  add column district       text check (char_length(district) <= 80),                       -- quartier
  add column is_physical    boolean not null default false,                                  -- les clients peuvent venir sur place
  -- Lien Google Maps uniquement (jamais un lien vers un autre site).
  add column maps_url       text check (char_length(maps_url) <= 500 and maps_url ~ '^https://((www\.)?google\.[a-z.]{2,8}/maps|maps\.google\.[a-z.]{2,8}/|maps\.app\.goo\.gl/|goo\.gl/maps/)'),
  add column lat            numeric(9, 6) check (lat between -90 and 90),
  add column lng            numeric(9, 6) check (lng between -180 and 180),
  add column whatsapp       text check (whatsapp ~ '^\+?[0-9 ]{8,20}$'),
  add column call_phone     text check (call_phone ~ '^\+?[0-9 ]{8,20}$'),
  add column sample_prices  jsonb not null default '[]' check (valid_sample_prices(sample_prices)),
  add constraint shop_location_pair check ((lat is null) = (lng is null)),
  -- Une adresse précise (carte, coordonnées) n'a de sens que pour une boutique physique.
  add constraint shop_location_physical check (is_physical or (maps_url is null and lat is null));

revoke select on shops from anon, authenticated;
grant select (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, status_reason, status_changed_at,
              created_at, response_time, payments, district, is_physical, maps_url, lat, lng, whatsapp, call_phone, sample_prices)
  on shops to anon, authenticated;

create or replace function admin_shop_contacts()
returns table (id uuid, owner_name text, contact_email text, contact_phone text)
language sql stable security definer set search_path = public as $$
  select s.id, s.owner_name, s.contact_email, s.contact_phone from shops s where is_admin();
$$;
revoke execute on function admin_shop_contacts() from public, anon;
grant execute on function admin_shop_contacts() to authenticated;

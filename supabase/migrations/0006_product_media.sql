-- NEXORA · photos, panoramas 360°, rotations 360° et modèles 3D des produits
--
--   photo    vraie photo du produit (galerie)
--   pano     photo panoramique 360° d'une pièce (visite immobilière), avec le nom de la pièce
--   spin     série de photos autour d'un objet (rotation 360°), dans l'ordre
--   model3d  modèle 3D généré par IA : déposé par le serveur seulement, marqué « IA », validé par l'admin
--
-- Les fichiers vont dans le stockage « product-media », dans un dossier au nom de la boutique :
-- un vendeur ne peut écrire que dans le dossier de SA boutique, et seulement si elle est autorisée.

-- Vrai même dans une fonction « security definer » (où current_user devient le propriétaire) :
-- on lit le rôle de la connexion (anon / authenticated = utilisateur du site).
create or replace function is_site_user() returns boolean
language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('role', true), ''), 'none') in ('anon', 'authenticated');
$$;

create type media_kind as enum ('photo', 'pano', 'spin', 'model3d');
create type media_status as enum ('approved', 'review', 'rejected');

alter table products
  add column price_unit text check (price_unit in ('mois', 'nuit', 'jour')),   -- « 150 000 FCFA / mois » pour une location
  add column updated_at timestamptz not null default now();

create table product_media (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products on delete cascade,
  shop_id       uuid not null references shops on delete cascade,
  kind          media_kind not null,
  path          text not null check (char_length(path) <= 300),
  position      integer not null default 0 check (position between 0 and 99),
  label         text check (char_length(label) <= 40),   -- nom de la pièce pour un panorama
  width         integer check (width between 1 and 20000),
  height        integer check (height between 1 and 20000),
  ai_generated  boolean not null default false,
  status        media_status not null default 'approved',
  created_at    timestamptz not null default now()
);
create index product_media_product_idx on product_media (product_id, kind, position);

-- Ajout par le vendeur : produit de sa boutique, chemin dans son dossier, quotas, jamais de 3D ni d'« IA ».
create or replace function prepare_product_media() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_shop uuid; v_count integer; v_max integer;
begin
  select shop_id into v_shop from products where id = new.product_id;
  if v_shop is null then raise exception 'Produit introuvable'; end if;
  new.shop_id := v_shop;
  if split_part(new.path, '/', 1) <> v_shop::text then raise exception 'Fichier hors du dossier de la boutique'; end if;
  if is_site_user() and not is_admin() then
    if new.kind = 'model3d' or new.ai_generated then raise exception 'Les modèles 3D sont fabriqués par NEXORA'; end if;
    new.status := 'approved';
  end if;
  v_max := case new.kind when 'photo' then 12 when 'pano' then 12 when 'spin' then 36 else 3 end;
  select count(*) into v_count from product_media where product_id = new.product_id and kind = new.kind;
  if v_count >= v_max then raise exception 'Limite atteinte : % fichiers de ce type par produit', v_max; end if;
  return new;
end $$;
create trigger product_media_prepare before insert on product_media
  for each row execute function prepare_product_media();

-- Le vendeur peut seulement réordonner ou renommer (pièce) ses médias.
create or replace function guard_product_media() returns trigger
language plpgsql set search_path = public as $$
begin
  if not is_end_user() or is_admin() then return new; end if;
  if (new.product_id, new.shop_id, new.kind, new.path, new.ai_generated, new.status) is distinct from
     (old.product_id, old.shop_id, old.kind, old.path, old.ai_generated, old.status) then
    raise exception 'Seuls l''ordre et le nom de la pièce peuvent être modifiés';
  end if;
  return new;
end $$;
create trigger product_media_guard before update on product_media
  for each row execute function guard_product_media();

alter table product_media enable row level security;
create policy "médias : publics si produit en ligne" on product_media for select using (
  is_admin()
  or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
  or (status = 'approved' and shop_is_live(shop_id)
      and exists (select 1 from products p where p.id = product_id and p.published)));
create policy "médias : ajout par le vendeur" on product_media for insert with check (
  exists (select 1 from products p join shops s on s.id = p.shop_id
          where p.id = product_id and s.owner_id = auth.uid() and s.status = 'approved'));
create policy "médias : modification par le vendeur" on product_media for update using (
  exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid() and s.status = 'approved'));
create policy "médias : suppression par le vendeur" on product_media for delete using (
  exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- Date de mise à jour des produits.
create or replace function touch_product() returns trigger
language plpgsql set search_path = public as $$ begin new.updated_at := now(); return new; end $$;
create trigger products_touch before update on products for each row execute function touch_product();

-- Un vendeur ne peut pas déplacer un produit vers la boutique d'un autre.
create or replace function guard_product() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_end_user() and not is_admin() and new.shop_id is distinct from old.shop_id then
    raise exception 'Un produit ne peut pas changer de boutique';
  end if;
  return new;
end $$;
create trigger products_guard before update on products for each row execute function guard_product();

-- ------------------------------------------------------------------ stockage des fichiers
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('product-media', 'product-media', true, 15728640, array['image/jpeg', 'image/webp', 'image/png', 'model/gltf-binary'])
      on conflict (id) do nothing;

    -- Écriture : seulement dans le dossier de SA boutique autorisée ; jamais de modèle 3D (réservé au serveur).
    execute $p$
      create policy "product-media : envoi par le vendeur" on storage.objects for insert to authenticated with check (
        bucket_id = 'product-media'
        and lower(storage.extension(name)) in ('jpg', 'jpeg', 'webp', 'png')
        and (storage.foldername(name))[1] in (
          select id::text from public.shops where owner_id = auth.uid() and status = 'approved'))
    $p$;
    execute $p$
      create policy "product-media : suppression par le vendeur" on storage.objects for delete to authenticated using (
        bucket_id = 'product-media'
        and (storage.foldername(name))[1] in (select id::text from public.shops where owner_id = auth.uid()))
    $p$;
  end if;
end $$;

-- Outils du paiement à la livraison (inspirés des plateformes de vente COD) :
--  1. confirmation de la commande par le client via un lien WhatsApp, avant l'expédition ;
--  2. livreurs du vendeur, attribués aux commandes, qui marquent « livré » ou « refusé » depuis un lien ;
--  3. comptabilité : argent encaissé par le livreur, puis remis au vendeur ;
--  4. nombre de colis refusés par un client (sur tout NEXORA), montré au vendeur avant l'envoi ;
--  5. pixels publicitaires Facebook / TikTok de la boutique (forfaits Pro et Ultra).

-- ------------------------------------------------------------------ 1. confirmation par le client
alter table orders add column if not exists confirm_token text unique default replace(gen_random_uuid()::text, '-', ''),
                   add column if not exists buyer_confirmed_at timestamptz;
update orders set confirm_token = replace(gen_random_uuid()::text, '-', '') where confirm_token is null;

-- Page publique /c/<jeton> : résumé de la commande (sans données sensibles) et bouton « Je confirme ».
create or replace function order_by_confirm_token(p_token text)
returns table (ref text, product_name text, shop_name text, qty int, total int, method payment_method, city text, confirmed boolean, status order_status)
language sql stable security definer set search_path = public as $$
  select o.ref, o.product_name, o.shop_name, o.qty, o.total, o.method, o.shipping_city, o.buyer_confirmed_at is not null, o.status
  from orders o where o.confirm_token = p_token and length(p_token) >= 20;
$$;
create or replace function confirm_order_by_token(p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update orders set buyer_confirmed_at = coalesce(buyer_confirmed_at, now())
    where confirm_token = p_token and length(p_token) >= 20 and status in ('pending_payment', 'confirmed');
  return found;
end $$;
grant execute on function order_by_confirm_token(text) to anon, authenticated;
grant execute on function confirm_order_by_token(text) to anon, authenticated;

-- ------------------------------------------------------------------ 2. livreurs
create table if not exists shop_couriers (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references shops on delete cascade,
  name       text not null check (char_length(name) between 2 and 60),
  phone      text not null check (phone ~ '^[+0-9 ]{6,30}$'),
  created_at timestamptz not null default now()
);
create index if not exists shop_couriers_shop_idx on shop_couriers (shop_id);
alter table shop_couriers enable row level security;
create policy "livreurs : le vendeur" on shop_couriers for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()) or is_admin())
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

alter table orders add column if not exists courier_id uuid references shop_couriers on delete set null,
                   add column if not exists courier_token text unique,
                   add column if not exists refused_at timestamptz,
                   add column if not exists cash_collected_at timestamptz,
                   add column if not exists cash_settled_at timestamptz;

-- Le vendeur attribue une commande à un de SES livreurs ; un lien personnel est créé pour le livreur.
create or replace function assign_courier(p_order uuid, p_courier uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if not exists (select 1 from orders o join shops s on s.id = o.shop_id where o.id = p_order and s.owner_id = auth.uid()) then
    raise exception 'Commande introuvable';
  end if;
  if p_courier is not null and not exists (select 1 from shop_couriers c join orders o on o.shop_id = c.shop_id where c.id = p_courier and o.id = p_order) then
    raise exception 'Livreur inconnu';
  end if;
  update orders set courier_id = p_courier,
                    courier_token = case when p_courier is null then null else coalesce(courier_token, replace(gen_random_uuid()::text, '-', '')) end
    where id = p_order returning courier_token into v_token;
  return v_token;
end $$;
revoke execute on function assign_courier(uuid, uuid) from public, anon;
grant execute on function assign_courier(uuid, uuid) to authenticated;

-- Page du livreur /l/<jeton> : adresse, repère, téléphone du client, montant à encaisser.
create or replace function order_for_courier(p_token text)
returns table (ref text, product_name text, qty int, total int, method payment_method, name text, phone text, city text, district text, landmark text, zone text, status order_status, refused boolean, shop_name text)
language sql stable security definer set search_path = public as $$
  select o.ref, o.product_name, o.qty, o.total, o.method, o.shipping_name, o.shipping_phone, o.shipping_city, o.shipping_district,
         o.shipping_landmark, o.delivery_zone, o.status, o.refused_at is not null, o.shop_name
  from orders o where o.courier_token = p_token and length(p_token) >= 20;
$$;
-- Le livreur marque « livré » (argent encaissé si paiement à la livraison) ou « refusé par le client ».
create or replace function courier_report(p_token text, p_outcome text) returns boolean
language plpgsql security definer set search_path = public as $$
declare o orders%rowtype;
begin
  select * into o from orders where courier_token = p_token and length(p_token) >= 20;
  if not found or o.status not in ('confirmed', 'shipped') then return false; end if;
  if p_outcome = 'delivered' then
    update orders set status = 'delivered',
                      cash_collected_at = case when o.method = 'cash_on_delivery' then now() end
      where id = o.id;
  elsif p_outcome = 'refused' then
    update orders set status = 'cancelled', refused_at = now() where id = o.id;
    update products set stock = stock + o.qty where id = o.product_id;
  else
    raise exception 'Résultat inconnu';
  end if;
  return true;
end $$;
grant execute on function order_for_courier(text) to anon, authenticated;
grant execute on function courier_report(text, text) to anon, authenticated;

-- Le vendeur note que le livreur lui a remis l'argent.
create or replace function settle_cash(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update orders o set cash_settled_at = now()
    where o.id = p_order and o.cash_collected_at is not null and o.cash_settled_at is null
      and exists (select 1 from shops s where s.id = o.shop_id and s.owner_id = auth.uid());
  if not found then raise exception 'Commande introuvable'; end if;
end $$;
revoke execute on function settle_cash(uuid) from public, anon;
grant execute on function settle_cash(uuid) to authenticated;

-- Ces colonnes ne bougent que par les fonctions ci-dessus (jamais directement depuis le navigateur).
create or replace function guard_order_cod_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_end_user() and not is_admin()
     and (new.confirm_token, new.buyer_confirmed_at, new.courier_id, new.courier_token, new.refused_at, new.cash_collected_at, new.cash_settled_at)
         is distinct from
         (old.confirm_token, old.buyer_confirmed_at, old.courier_id, old.courier_token, old.refused_at, old.cash_collected_at, old.cash_settled_at) then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;
drop trigger if exists guard_order_cod_columns on orders;
create trigger guard_order_cod_columns before update on orders for each row execute function guard_order_cod_columns();

-- ------------------------------------------------------------------ 4. refus d'un client (pour le vendeur)
create or replace function buyer_refusals(p_order uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from orders r
  where r.refused_at is not null
    and r.buyer_id = (select o.buyer_id from orders o join shops s on s.id = o.shop_id where o.id = p_order and s.owner_id = auth.uid());
$$;
revoke execute on function buyer_refusals(uuid) from public, anon;
grant execute on function buyer_refusals(uuid) to authenticated;

-- ------------------------------------------------------------------ 5. pixels publicitaires
alter table shops add column if not exists fb_pixel_id text check (fb_pixel_id is null or fb_pixel_id ~ '^[0-9]{6,20}$'),
                  add column if not exists tiktok_pixel_id text check (tiktok_pixel_id is null or tiktok_pixel_id ~ '^[A-Z0-9]{10,30}$');

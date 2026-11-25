-- Livraison adaptée au Mali :
--  1. adresse en 3 parties (ville, quartier, point de repère) + téléphone, gardée sur le profil pour ne rien redemander ;
--  2. zones et frais de livraison choisis par chaque vendeur (ex. Bamako 1 000 F, Kati 2 000 F, retrait gratuit) ;
--  3. frais ajoutés au total PAR LA BASE (le prix ne peut pas être modifié depuis le navigateur).

alter table profiles add column if not exists district text check (char_length(district) <= 80),
                     add column if not exists landmark text check (char_length(landmark) <= 160);

alter table orders add column if not exists shipping_district text check (char_length(shipping_district) <= 80),
                   add column if not exists shipping_landmark text check (char_length(shipping_landmark) <= 160),
                   add column if not exists delivery_zone_id uuid,
                   add column if not exists delivery_zone text,
                   add column if not exists delivery_fee int not null default 0 check (delivery_fee >= 0);

create table if not exists shop_delivery_zones (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references shops on delete cascade,
  name       text not null check (char_length(name) between 2 and 60),
  fee        int not null default 0 check (fee between 0 and 1000000),
  delay      text check (char_length(delay) <= 40),
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists shop_delivery_zones_shop_idx on shop_delivery_zones (shop_id, position);
alter table shop_delivery_zones enable row level security;
create policy "zones : visibles avec la boutique" on shop_delivery_zones for select
  using (exists (select 1 from shops s where s.id = shop_id and (s.status = 'approved' or s.owner_id = auth.uid())) or is_admin());
create policy "zones : le vendeur" on shop_delivery_zones for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- 20 zones au plus par boutique.
create or replace function limit_delivery_zones() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from shop_delivery_zones where shop_id = new.shop_id) >= 20 then raise exception '20 zones de livraison au plus'; end if;
  return new;
end $$;
drop trigger if exists limit_delivery_zones on shop_delivery_zones;
create trigger limit_delivery_zones before insert on shop_delivery_zones for each row execute function limit_delivery_zones();

-- Commande : la zone choisie fixe les frais (lus dans la base), ajoutés au total.
create or replace function prepare_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare p products%rowtype; s shops%rowtype; z shop_delivery_zones%rowtype;
begin
  select * into p from products where id = new.product_id and shop_id = new.shop_id and published;
  if not found then raise exception 'Produit indisponible'; end if;
  select * into s from shops where id = new.shop_id;
  if s.status <> 'approved' then raise exception 'Boutique indisponible'; end if;
  if new.method = 'cash_on_delivery' and not s.accepts_cod then raise exception 'Ce vendeur n''accepte pas le paiement à la livraison'; end if;
  if new.method <> 'cash_on_delivery' and not (new.method = any (s.payments)) then raise exception 'Moyen de paiement non accepté par ce vendeur'; end if;
  if p.stock < new.qty then raise exception 'Stock insuffisant'; end if;
  new.delivery_fee := 0;
  new.delivery_zone := null;
  if new.delivery_zone_id is not null then
    select * into z from shop_delivery_zones where id = new.delivery_zone_id and shop_id = new.shop_id;
    if not found then raise exception 'Zone de livraison inconnue'; end if;
    new.delivery_fee := z.fee;
    new.delivery_zone := z.name;
  elsif exists (select 1 from shop_delivery_zones where shop_id = new.shop_id) then
    raise exception 'Choisissez une zone de livraison';
  end if;
  new.total := new.qty * case when p.wholesale_min is not null and new.qty >= p.wholesale_min
                               then p.wholesale_price else p.price end
               + new.delivery_fee;
  new.status := case when new.method = 'cash_on_delivery' then 'confirmed' else 'pending_payment' end;
  new.product_name := p.name;
  new.product_slug := p.slug;
  new.shop_name := s.name;
  update products set stock = stock - new.qty where id = p.id;
  return new;
end $$;

-- L'adresse et la livraison d'une commande ne changent plus après coup (seul le statut évolue).
create or replace function guard_order_update() returns trigger
language plpgsql set search_path = public as $$
declare is_buyer boolean := old.buyer_id = auth.uid();
        is_seller boolean := exists (select 1 from shops where id = old.shop_id and owner_id = auth.uid());
begin
  new.updated_at := now();
  if not is_end_user() or is_admin() then return new; end if;
  if (new.buyer_id, new.shop_id, new.product_id, new.qty, new.total, new.method, new.shipping_name, new.shipping_phone,
      new.shipping_city, new.created_at, new.product_name, new.product_slug, new.shop_name,
      new.shipping_district, new.shipping_landmark, new.delivery_zone_id, new.delivery_zone, new.delivery_fee)
     is distinct from
     (old.buyer_id, old.shop_id, old.product_id, old.qty, old.total, old.method, old.shipping_name, old.shipping_phone,
      old.shipping_city, old.created_at, old.product_name, old.product_slug, old.shop_name,
      old.shipping_district, old.shipping_landmark, old.delivery_zone_id, old.delivery_zone, old.delivery_fee) then
    raise exception 'Seul le statut d''une commande peut être modifié';
  end if;
  if new.status = old.status then return new; end if;
  if is_buyer and old.status in ('confirmed', 'shipped') and new.status in ('delivered', 'not_received') then return new; end if;
  if is_seller and (
       (old.status = 'confirmed' and new.status in ('shipped', 'cancelled'))
    or (old.status in ('confirmed', 'shipped', 'delivered', 'not_received') and new.status = 'refunded')) then return new; end if;
  raise exception 'Changement de statut non autorisé (% → %)', old.status, new.status;
end $$;

-- NEXORA · schéma initial
-- Toutes les tables ont la Row Level Security (RLS) activée : la base refuse
-- d'elle-même tout accès qui n'est pas explicitement autorisé ci-dessous.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ types
create type user_role      as enum ('client', 'seller', 'admin');
create type shop_status    as enum ('pending', 'approved', 'suspended', 'rejected', 'closed');
create type payment_method as enum ('orange_money', 'wave', 'mtn_momo', 'moov_money', 'card', 'cash_on_delivery');
create type payout_type    as enum ('orange_money', 'wave', 'mtn_momo', 'moov_money', 'card', 'bank');
create type order_status   as enum ('pending_payment', 'confirmed', 'shipped', 'delivered', 'not_received', 'refunded', 'cancelled');
create type ticket_kind    as enum ('contact', 'report', 'refund');
create type ticket_status  as enum ('open', 'in_progress', 'resolved');
create type plan_id        as enum ('essentiel', 'pro', 'business');

-- ------------------------------------------------------------------ profils
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        user_role not null default 'client',
  full_name   text,
  phone       text,
  city        text,
  country     text,
  created_at  timestamptz not null default now()
);
-- Un seul administrateur possible sur toute la plateforme.
create unique index one_admin_only on profiles ((role)) where role = 'admin';

-- Vrai quand la requête vient d'un utilisateur du site (navigateur), faux pour
-- l'éditeur SQL du propriétaire et le serveur (clé service_role).
create or replace function is_end_user() returns boolean
language sql stable set search_path = public as $$ select current_user in ('anon', 'authenticated') $$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Création automatique du profil à l'inscription.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Un utilisateur ne peut pas changer son propre rôle.
create or replace function protect_role() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.role is distinct from old.role and is_end_user() and not is_admin() then
    raise exception 'Seul l''administrateur peut modifier un rôle';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on profiles
  for each row execute function protect_role();

-- ------------------------------------------------------------------ boutiques
create table shops (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references profiles on delete cascade,
  slug               text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name               text not null check (char_length(name) between 2 and 60),
  description        text check (char_length(description) <= 2000),
  category           text not null,
  city               text not null,
  country            text not null,
  accepts_cod        boolean not null default true,
  status             shop_status not null default 'pending',
  status_reason      text,
  status_changed_at  timestamptz,
  created_at         timestamptz not null default now()
);

-- Seul l'administrateur peut autoriser / suspendre. Le vendeur ne peut que fermer.
create or replace function protect_shop_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.owner_id is distinct from old.owner_id and is_end_user() then
    raise exception 'Le propriétaire d''une boutique ne peut pas être changé';
  end if;
  if new.status is distinct from old.status then
    if is_end_user() and not is_admin() and not (new.status = 'closed' and old.owner_id = auth.uid()) then
      raise exception 'Statut de boutique modifiable uniquement par l''administrateur';
    end if;
    new.status_changed_at := now();
  end if;
  return new;
end $$;
create trigger shops_protect_status before update on shops
  for each row execute function protect_shop_status();

-- Comptes d'encaissement du vendeur : l'argent des clients y arrive directement.
-- On ne stocke jamais le numéro complet : seulement un jeton du prestataire et les 4 derniers chiffres.
create table payout_accounts (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references shops on delete cascade,
  type            payout_type not null,
  provider_token  text not null,
  last4           text not null check (last4 ~ '^[0-9A-Za-z]{2,4}$'),
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------------ abonnements
create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  shop_id            uuid not null unique references shops on delete cascade,
  plan               plan_id not null,
  annual             boolean not null default false,
  active             boolean not null default false,
  current_period_end timestamptz,
  provider_ref       text,
  created_at         timestamptz not null default now()
);

-- ------------------------------------------------------------------ catalogue
create table products (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops on delete cascade,
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,90}$'),
  name          text not null check (char_length(name) between 2 and 120),
  short         text check (char_length(short) <= 200),
  description   text check (char_length(description) <= 5000),
  category      text not null,
  price         integer not null check (price > 0),
  compare_at    integer check (compare_at is null or compare_at > price),
  stock         integer not null default 0 check (stock >= 0),
  wholesale_min integer check (wholesale_min is null or wholesale_min > 1),
  wholesale_price integer check (wholesale_price is null or wholesale_price > 0),
  images        text[] not null default '{}',
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index products_shop_idx on products (shop_id);
create index products_category_idx on products (category) where published;

-- ------------------------------------------------------------------ commandes
create table orders (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique default ('NX-' || upper(substr(md5(random()::text), 1, 6))),
  buyer_id       uuid not null references profiles,
  shop_id        uuid not null references shops,
  product_id     uuid not null references products,
  qty            integer not null check (qty > 0),
  total          integer not null check (total > 0),
  method         payment_method not null,
  status         order_status not null default 'pending_payment',
  shipping_name  text not null,
  shipping_phone text not null,
  shipping_city  text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_buyer_idx on orders (buyer_id);
create index orders_shop_idx on orders (shop_id);

-- Le total est TOUJOURS recalculé par la base à partir du prix réel (jamais celui du navigateur).
create or replace function prepare_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare p products%rowtype;
begin
  select * into p from products where id = new.product_id and shop_id = new.shop_id and published;
  if not found then raise exception 'Produit indisponible'; end if;
  if p.stock < new.qty then raise exception 'Stock insuffisant'; end if;
  new.total := new.qty * case when p.wholesale_min is not null and new.qty >= p.wholesale_min
                               then p.wholesale_price else p.price end;
  -- Paiement à la livraison : confirmée tout de suite. En ligne : attend la confirmation du prestataire.
  new.status := case when new.method = 'cash_on_delivery' then 'confirmed' else 'pending_payment' end;
  update products set stock = stock - new.qty where id = p.id;
  return new;
end $$;
create trigger orders_prepare before insert on orders
  for each row execute function prepare_order();

-- Qui peut faire quoi sur une commande existante.
create or replace function guard_order_update() returns trigger
language plpgsql set search_path = public as $$
declare is_buyer boolean := old.buyer_id = auth.uid();
        is_seller boolean := exists (select 1 from shops where id = old.shop_id and owner_id = auth.uid());
begin
  new.updated_at := now();
  if not is_end_user() or is_admin() then return new; end if;
  if (new.buyer_id, new.shop_id, new.product_id, new.qty, new.total, new.method, new.shipping_name, new.shipping_phone, new.shipping_city, new.created_at)
     is distinct from
     (old.buyer_id, old.shop_id, old.product_id, old.qty, old.total, old.method, old.shipping_name, old.shipping_phone, old.shipping_city, old.created_at) then
    raise exception 'Seul le statut d''une commande peut être modifié';
  end if;
  if new.status = old.status then return new; end if;
  -- L'acheteur : « J'ai reçu » ou « Pas reçu », une fois la commande confirmée ou expédiée.
  if is_buyer and old.status in ('confirmed', 'shipped') and new.status in ('delivered', 'not_received') then return new; end if;
  -- Le vendeur : expédier, annuler avant expédition, rembourser.
  if is_seller and (
       (old.status = 'confirmed' and new.status in ('shipped', 'cancelled'))
    or (old.status in ('confirmed', 'shipped', 'delivered', 'not_received') and new.status = 'refunded')) then return new; end if;
  raise exception 'Changement de statut non autorisé (% → %)', old.status, new.status;
end $$;
create trigger orders_guard before update on orders
  for each row execute function guard_order_update();

-- ------------------------------------------------------------------ avis (achat vérifié uniquement)
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null unique references orders on delete cascade, -- 1 avis par commande
  product_id   uuid not null references products on delete cascade,
  author_id    uuid not null references profiles on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  title        text not null check (char_length(title) between 2 and 80),
  body         text not null check (char_length(body) between 5 and 1000),
  seller_reply text check (char_length(seller_reply) <= 1000),
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------ SAV
create table tickets (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references profiles on delete set null,
  kind        ticket_kind not null,
  order_id    uuid references orders,
  shop_id     uuid references shops,
  message     text not null check (char_length(message) between 5 and 2000),
  status      ticket_status not null default 'open',
  -- Délai laissé au vendeur pour rembourser avant arbitrage de l'administrateur.
  seller_deadline timestamptz,
  created_at  timestamptz not null default now()
);

create or replace function set_ticket_deadline() returns trigger
language plpgsql set search_path = public as $$
begin
  new.seller_deadline := case when new.kind = 'refund' then new.created_at + interval '72 hours' end;
  return new;
end $$;
create trigger tickets_deadline before insert on tickets
  for each row execute function set_ticket_deadline();

-- ------------------------------------------------------------------ préférences e-mail
create table notification_preferences (
  user_id               uuid primary key references profiles on delete cascade,
  order_updates         boolean not null default true,
  delivery_updates      boolean not null default true,
  review_request        boolean not null default true,
  promotions            boolean not null default false,
  newsletter            boolean not null default false,
  seller_new_order      boolean not null default true,
  seller_weekly_summary boolean not null default true
);

-- ------------------------------------------------------------------ journal d'administration
create table admin_audit (
  id         bigserial primary key,
  actor_id   uuid references profiles,
  action     text not null,
  target     text not null,
  details    jsonb,
  created_at timestamptz not null default now()
);

-- ================================================================== RLS
alter table profiles                 enable row level security;
alter table shops                    enable row level security;
alter table payout_accounts          enable row level security;
alter table subscriptions            enable row level security;
alter table products                 enable row level security;
alter table orders                   enable row level security;
alter table reviews                  enable row level security;
alter table tickets                  enable row level security;
alter table notification_preferences enable row level security;
alter table admin_audit              enable row level security;

-- profils
create policy "profil : lecture de soi" on profiles for select using (id = auth.uid() or is_admin());
create policy "profil : mise à jour de soi" on profiles for update using (id = auth.uid() or is_admin());

-- boutiques : publiques si autorisées
create policy "boutiques autorisées visibles" on shops for select using (status = 'approved' or owner_id = auth.uid() or is_admin());
create policy "demande d'ouverture" on shops for insert with check (owner_id = auth.uid() and status = 'pending');
create policy "le vendeur modifie sa boutique" on shops for update using (owner_id = auth.uid() or is_admin());

-- comptes d'encaissement : propriétaire uniquement (même l'admin ne les lit pas)
create policy "encaissement : propriétaire" on payout_accounts for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- abonnements
create policy "abonnement : propriétaire ou admin" on subscriptions for select
  using (is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- produits : visibles seulement si la boutique est autorisée
create policy "produits publics" on products for select
  using (published and exists (select 1 from shops s where s.id = shop_id and s.status = 'approved')
         or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()) or is_admin());
create policy "produits : vendeur autorisé" on products for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid() and s.status = 'approved'))
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid() and s.status = 'approved'));

-- commandes : acheteur, vendeur concerné, admin
create policy "commandes : parties prenantes" on orders for select
  using (buyer_id = auth.uid() or is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "commande : acheteur connecté" on orders for insert
  with check (buyer_id = auth.uid() and exists (select 1 from shops s where s.id = shop_id and s.status = 'approved'));
create policy "commande : mise à jour par les parties" on orders for update
  using (buyer_id = auth.uid() or is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- avis : lecture publique, écriture réservée à l'acheteur d'une commande livrée
create policy "avis publics" on reviews for select using (true);
create policy "avis : achat vérifié" on reviews for insert with check (
  author_id = auth.uid() and exists (
    select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid() and o.product_id = reviews.product_id and o.status = 'delivered'));

-- SAV : l'auteur et l'admin
create policy "tickets : auteur ou admin" on tickets for select using (author_id = auth.uid() or is_admin());
create policy "tickets : création" on tickets for insert with check (author_id = auth.uid());
create policy "tickets : admin" on tickets for update using (is_admin());

-- préférences : soi-même
create policy "préférences : soi" on notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- journal : admin en lecture seule
create policy "journal : admin" on admin_audit for select using (is_admin());

-- ================================================================== fermeture de boutique
-- Ferme la boutique et, au choix, supprime les comptes de paiement et l'abonnement.
create or replace function close_my_shop(p_shop uuid, p_remove_payouts boolean, p_cancel_subscription boolean, p_unpublish boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from shops where id = p_shop and owner_id = auth.uid()) then
    raise exception 'Boutique introuvable';
  end if;
  update shops set status = 'closed' where id = p_shop;
  if p_remove_payouts then delete from payout_accounts where shop_id = p_shop; end if;
  if p_cancel_subscription then update subscriptions set active = false, current_period_end = now() where shop_id = p_shop; end if;
  if p_unpublish then update products set published = false where shop_id = p_shop; end if;
end $$;

-- Décision de l'administrateur sur une boutique, journalisée.
create or replace function admin_set_shop_status(p_shop uuid, p_status shop_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update shops set status = p_status, status_reason = p_reason where id = p_shop;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'shop_status', p_shop::text, jsonb_build_object('status', p_status, 'reason', p_reason));
end $$;

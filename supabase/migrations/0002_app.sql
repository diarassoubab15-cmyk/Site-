-- NEXORA · compléments pour l'application
-- Colonnes d'affichage, copies figées des noms (une commande garde le nom du produit
-- même si la boutique est fermée), suppression de compte, abonnement à la demande.

-- ------------------------------------------------------------------ profils
alter table profiles add column email text;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, phone) values (new.id, new.email, new.phone);
  insert into notification_preferences (user_id) values (new.id);
  return new;
end $$;

-- ------------------------------------------------------------------ boutiques
alter table shops
  add column owner_name     text,
  add column contact_email  text,
  add column contact_phone  text,
  add column response_time  text not null default 'répond en ~2 h',
  -- Moyens de paiement EN LIGNE acceptés (le paiement à la livraison dépend de accepts_cod).
  add column payments       payment_method[] not null default '{orange_money,wave,card}';

-- Le vendeur obtient le rôle « seller » quand l'administrateur autorise sa boutique.
create or replace function admin_set_shop_status(p_shop uuid, p_status shop_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update shops set status = p_status, status_reason = p_reason where id = p_shop;
  if p_status = 'approved' then
    update profiles set role = 'seller' where id = (select owner_id from shops where id = p_shop) and role = 'client';
    update subscriptions set active = true where shop_id = p_shop; -- en production : après paiement confirmé
  elsif p_status in ('suspended', 'rejected') then
    update subscriptions set active = false where shop_id = p_shop;
  end if;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'shop_status', p_shop::text, jsonb_build_object('status', p_status, 'reason', p_reason));
end $$;

-- Le vendeur crée sa ligne d'abonnement (inactive) avec sa demande d'ouverture.
create policy "abonnement : demande" on subscriptions for insert
  with check (active = false and exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- ------------------------------------------------------------------ produits
alter table products
  add column specs jsonb not null default '[]',
  add column glyph text not null default '◆',
  add column tone  text not null default '#9281f7' check (tone ~ '^#[0-9a-fA-F]{6}$');

-- ------------------------------------------------------------------ commandes
alter table orders
  add column product_name text,
  add column product_slug text,
  add column shop_name    text,
  alter column buyer_id   drop not null,
  alter column shop_id    drop not null,
  alter column product_id drop not null;

-- Supprimer un compte ne doit pas être bloqué par l'historique : il est anonymisé.
alter table orders drop constraint orders_buyer_id_fkey,
  add constraint orders_buyer_id_fkey foreign key (buyer_id) references profiles on delete set null;
alter table orders drop constraint orders_shop_id_fkey,
  add constraint orders_shop_id_fkey foreign key (shop_id) references shops on delete set null;
alter table orders drop constraint orders_product_id_fkey,
  add constraint orders_product_id_fkey foreign key (product_id) references products on delete set null;
alter table tickets drop constraint tickets_order_id_fkey,
  add constraint tickets_order_id_fkey foreign key (order_id) references orders on delete set null;
alter table tickets drop constraint tickets_shop_id_fkey,
  add constraint tickets_shop_id_fkey foreign key (shop_id) references shops on delete set null;

create or replace function prepare_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare p products%rowtype; s shops%rowtype;
begin
  select * into p from products where id = new.product_id and shop_id = new.shop_id and published;
  if not found then raise exception 'Produit indisponible'; end if;
  select * into s from shops where id = new.shop_id;
  if s.status <> 'approved' then raise exception 'Boutique indisponible'; end if;
  if new.method = 'cash_on_delivery' and not s.accepts_cod then raise exception 'Ce vendeur n''accepte pas le paiement à la livraison'; end if;
  if new.method <> 'cash_on_delivery' and not (new.method = any (s.payments)) then raise exception 'Moyen de paiement non accepté par ce vendeur'; end if;
  if p.stock < new.qty then raise exception 'Stock insuffisant'; end if;
  new.total := new.qty * case when p.wholesale_min is not null and new.qty >= p.wholesale_min
                               then p.wholesale_price else p.price end;
  new.status := case when new.method = 'cash_on_delivery' then 'confirmed' else 'pending_payment' end;
  new.product_name := p.name;
  new.product_slug := p.slug;
  new.shop_name := s.name;
  update products set stock = stock - new.qty where id = p.id;
  return new;
end $$;

create or replace function guard_order_update() returns trigger
language plpgsql set search_path = public as $$
declare is_buyer boolean := old.buyer_id = auth.uid();
        is_seller boolean := exists (select 1 from shops where id = old.shop_id and owner_id = auth.uid());
begin
  new.updated_at := now();
  if not is_end_user() or is_admin() then return new; end if;
  if (new.buyer_id, new.shop_id, new.product_id, new.qty, new.total, new.method, new.shipping_name, new.shipping_phone,
      new.shipping_city, new.created_at, new.product_name, new.product_slug, new.shop_name)
     is distinct from
     (old.buyer_id, old.shop_id, old.product_id, old.qty, old.total, old.method, old.shipping_name, old.shipping_phone,
      old.shipping_city, old.created_at, old.product_name, old.product_slug, old.shop_name) then
    raise exception 'Seul le statut d''une commande peut être modifié';
  end if;
  if new.status = old.status then return new; end if;
  if is_buyer and old.status in ('confirmed', 'shipped') and new.status in ('delivered', 'not_received') then return new; end if;
  if is_seller and (
       (old.status = 'confirmed' and new.status in ('shipped', 'cancelled'))
    or (old.status in ('confirmed', 'shipped', 'delivered', 'not_received') and new.status = 'refunded')) then return new; end if;
  raise exception 'Changement de statut non autorisé (% → %)', old.status, new.status;
end $$;

-- ------------------------------------------------------------------ avis
-- Nom et ville de l'auteur copiés à la publication : les profils restent privés.
alter table reviews add column author_name text, add column author_city text;

create or replace function prepare_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare pr profiles%rowtype;
begin
  select * into pr from profiles where id = new.author_id;
  -- « Aïcha Koné » devient « Aïcha K. »
  new.author_name := coalesce(nullif(regexp_replace(trim(coalesce(pr.full_name, '')), '^(\S+)\s+(\S).*$', '\1 \2.'), ''), 'Client');
  new.author_city := pr.city;
  return new;
end $$;
create trigger reviews_prepare before insert on reviews
  for each row execute function prepare_review();

-- Le vendeur répond à un avis sur ses produits (et ne peut rien modifier d'autre).
create policy "avis : réponse du vendeur" on reviews for update
  using (exists (select 1 from products p join shops s on s.id = p.shop_id where p.id = product_id and s.owner_id = auth.uid()));

create or replace function guard_review_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_end_user() and not is_admin() and
     (new.rating, new.title, new.body, new.author_id, new.order_id, new.product_id) is distinct from
     (old.rating, old.title, old.body, old.author_id, old.order_id, old.product_id) then
    raise exception 'Le vendeur peut seulement répondre à un avis';
  end if;
  return new;
end $$;
create trigger reviews_guard before update on reviews
  for each row execute function guard_review_update();

-- ------------------------------------------------------------------ SAV
alter table tickets add column shop_name text, add column order_ref text;

create or replace function set_ticket_deadline() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.seller_deadline := case when new.kind = 'refund' then new.created_at + interval '72 hours' end;
  if new.order_id is not null then
    select shop_id, shop_name, ref into new.shop_id, new.shop_name, new.order_ref from orders where id = new.order_id;
  elsif new.shop_id is not null and new.shop_name is null then
    select name into new.shop_name from shops where id = new.shop_id;
  end if;
  return new;
end $$;

-- Un litige « produit non reçu » ne peut concerner qu'une commande de l'auteur.
drop policy "tickets : création" on tickets;
create policy "tickets : création" on tickets for insert with check (
  author_id = auth.uid()
  and (order_id is null or exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid())));

-- ------------------------------------------------------------------ fermeture de boutique
create or replace function close_my_shop(p_shop uuid, p_remove_payouts boolean, p_cancel_subscription boolean, p_unpublish boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from shops where id = p_shop and owner_id = auth.uid()) then
    raise exception 'Boutique introuvable';
  end if;
  update shops set status = 'closed', status_changed_at = now() where id = p_shop;
  if p_remove_payouts then delete from payout_accounts where shop_id = p_shop; end if;
  if p_cancel_subscription then update subscriptions set active = false, current_period_end = now() where shop_id = p_shop; end if;
  if p_unpublish then update products set published = false where shop_id = p_shop; end if;
end $$;

-- Droits d'exécution explicites (Supabase les accorde par défaut ; utile hors Supabase).
grant execute on function close_my_shop(uuid, boolean, boolean, boolean) to authenticated;
grant execute on function admin_set_shop_status(uuid, shop_status, text) to authenticated;

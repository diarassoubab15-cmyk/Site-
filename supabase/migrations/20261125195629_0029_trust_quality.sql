-- Qualités des grandes marketplaces, défauts corrigés :
--  1. carte : une seule transaction par commande (pas de double débit) ;
--  2. date de livraison prévue + commandes en retard (délai d'expédition de la boutique, délais par zone) ;
--  3. réclamations avec photos (privées : auteur et admin) ;
--  4. note de fiabilité du vendeur, calculée par la base ;
--  5. règle de retour choisie par le vendeur ;
--  6. avis avec photos ;
--  8. produits « Fait au Mali » / « fait main ».

-- ------------------------------------------------------------------ 1 et 2 : commandes
alter table orders add column if not exists card_tx_id text,
                   add column if not exists shipped_at timestamptz,
                   add column if not exists delivered_at timestamptz;

create or replace function stamp_order_dates() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'shipped' and new.shipped_at is null then new.shipped_at := now(); end if;
    if new.status = 'delivered' then
      new.delivered_at := coalesce(new.delivered_at, now());
      new.shipped_at := coalesce(new.shipped_at, now());
    end if;
  end if;
  return new;
end $$;
drop trigger if exists zz_stamp_order_dates on orders;
create trigger zz_stamp_order_dates before update on orders for each row execute function stamp_order_dates();

-- Ces colonnes ne bougent que par le serveur ou les fonctions dédiées.
create or replace function guard_order_cod_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_end_user() and not is_admin()
     and (new.confirm_token, new.buyer_confirmed_at, new.courier_id, new.courier_token, new.refused_at, new.cash_collected_at, new.cash_settled_at,
          new.card_tx_id, new.shipped_at, new.delivered_at)
         is distinct from
         (old.confirm_token, old.buyer_confirmed_at, old.courier_id, old.courier_token, old.refused_at, old.cash_collected_at, old.cash_settled_at,
          old.card_tx_id, old.shipped_at, old.delivered_at) then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;

alter table shops add column if not exists ship_days int not null default 2 check (ship_days between 0 and 30),
                  add column if not exists return_policy text check (return_policy in ('7j', '14j', 'echange', 'aucun'));
alter table shop_delivery_zones add column if not exists days_min int check (days_min between 0 and 60),
                                add column if not exists days_max int check (days_max between 0 and 60);

-- ------------------------------------------------------------------ 3 et 6 : photos
alter table tickets add column if not exists photos text[] not null default '{}' check (cardinality(photos) <= 4);
alter table reviews add column if not exists photos text[] not null default '{}' check (cardinality(photos) <= 4);

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('review-photos', 'review-photos', true, 5242880, array['image/jpeg', 'image/webp', 'image/png']),
             ('ticket-photos', 'ticket-photos', false, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
      on conflict (id) do nothing;
    -- Chaque client envoie dans son propre dossier (son identifiant).
    execute $p$
      create policy "photos clients : envoi dans son dossier" on storage.objects for insert to authenticated with check (
        bucket_id in ('review-photos', 'ticket-photos')
        and lower(storage.extension(name)) in ('jpg', 'jpeg', 'webp', 'png')
        and (storage.foldername(name))[1] = auth.uid()::text)
    $p$;
    -- Photos de réclamation : lisibles par leur auteur et par l'admin seulement.
    execute $p$
      create policy "photos de réclamation : auteur ou admin" on storage.objects for select to authenticated using (
        bucket_id = 'ticket-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
    $p$;
  end if;
end $$;

-- Une photo jointe doit venir du dossier de son auteur.
create or replace function check_customer_photos() returns trigger
language plpgsql set search_path = public as $$
declare p text;
begin
  foreach p in array coalesce(new.photos, '{}') loop
    if p !~ ('^' || new.author_id::text || '/[a-z0-9-]{8,64}\.(jpg|jpeg|webp|png)$') then raise exception 'Photo invalide'; end if;
  end loop;
  return new;
end $$;
drop trigger if exists check_ticket_photos on tickets;
create trigger check_ticket_photos before insert or update of photos on tickets for each row execute function check_customer_photos();
drop trigger if exists check_review_photos on reviews;
create trigger check_review_photos before insert or update of photos on reviews for each row execute function check_customer_photos();

-- ------------------------------------------------------------------ 4 : fiabilité du vendeur (6 derniers mois)
create or replace function shop_reliability(p_slug text)
returns table (orders int, on_time_pct int, delivered_pct int, refused int, disputes int, reply_pct int)
language sql stable security definer set search_path = public as $$
  with s as (select id, ship_days from shops where slug = p_slug and status = 'approved'),
       o as (select o.* from orders o join s on s.id = o.shop_id where o.created_at > now() - interval '180 days' and o.status <> 'pending_payment')
  select
    (select count(*)::int from o),
    (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where o.shipped_at <= o.created_at + make_interval(days => greatest(s.ship_days, 1))) / count(*))::int end
       from o, s where o.shipped_at is not null or (o.status in ('confirmed') and o.created_at < now() - make_interval(days => greatest(s.ship_days, 1)))),
    (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where o.status = 'delivered') / count(*))::int end
       from o where o.status in ('delivered', 'not_received', 'refunded', 'cancelled')),
    (select count(*)::int from o where o.refused_at is not null),
    (select count(*)::int from tickets t join s on s.id = t.shop_id where t.kind in ('refund', 'report') and t.created_at > now() - interval '180 days'),
    (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where c.seller_reply is not null) / count(*))::int end
       from shop_comments c join s on s.id = c.shop_id where not c.hidden);
$$;
grant execute on function shop_reliability(text) to anon, authenticated;

-- ------------------------------------------------------------------ 8 : fait au Mali / fait main
alter table products add column if not exists made_in_mali boolean not null default false,
                     add column if not exists handmade boolean not null default false;

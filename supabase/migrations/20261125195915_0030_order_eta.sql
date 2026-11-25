-- Date de livraison prévue, fixée à la commande : délai d'expédition de la boutique + délai de la zone choisie.
-- Une commande non livrée après la date maximale est « en retard » (affichée au client, au vendeur et à l'admin).
alter table orders add column if not exists eta_min date,
                   add column if not exists eta_max date;

create or replace function stamp_order_eta() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_ship int; v_min int; v_max int;
begin
  select ship_days into v_ship from shops where id = new.shop_id;
  if new.delivery_zone_id is not null then
    select days_min, days_max into v_min, v_max from shop_delivery_zones where id = new.delivery_zone_id;
  end if;
  v_ship := coalesce(v_ship, 2);
  v_min := coalesce(v_min, 1);
  v_max := greatest(coalesce(v_max, v_min + 2), v_min);
  new.eta_min := current_date + v_ship + v_min;
  new.eta_max := current_date + v_ship + v_max;
  return new;
end $$;
drop trigger if exists stamp_order_eta on orders;
create trigger stamp_order_eta before insert on orders for each row execute function stamp_order_eta();

-- La date prévue ne se modifie pas depuis le navigateur.
create or replace function guard_order_cod_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_end_user() and not is_admin()
     and (new.confirm_token, new.buyer_confirmed_at, new.courier_id, new.courier_token, new.refused_at, new.cash_collected_at, new.cash_settled_at,
          new.card_tx_id, new.shipped_at, new.delivered_at, new.eta_min, new.eta_max)
         is distinct from
         (old.confirm_token, old.buyer_confirmed_at, old.courier_id, old.courier_token, old.refused_at, old.cash_collected_at, old.cash_settled_at,
          old.card_tx_id, old.shipped_at, old.delivered_at, old.eta_min, old.eta_max) then
    raise exception 'Modification non autorisée';
  end if;
  return new;
end $$;

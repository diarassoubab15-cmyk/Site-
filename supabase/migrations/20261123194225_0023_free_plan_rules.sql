-- Formule gratuite « Découverte » (2/2) : 0 FCFA, 10 produits en ligne, active dès que l'admin autorise la boutique.
-- Le vendeur passe à Base, Pro ou Ultra quand il veut, par le circuit de paiement habituel.

create or replace function plan_monthly_price(p plan_id) returns integer
language sql immutable set search_path = public as $$
  select case p when 'decouverte' then 0 when 'essentiel' then 15000 when 'pro' then 25000 when 'business' then 50000 end;
$$;

create or replace function plan_product_limit(p plan_id) returns integer
language sql immutable set search_path = public as $$
  select case p when 'decouverte' then 10 when 'essentiel' then 100 when 'pro' then 1000 else null end;
$$;

-- Rien à payer pour la formule gratuite : aucune demande de paiement ne peut la viser.
create or replace function no_free_plan_payment() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.plan = 'decouverte' then raise exception 'La formule Découverte est gratuite : aucun paiement à faire'; end if;
  return new;
end $$;
drop trigger if exists no_free_plan_payment on subscription_payments;
create trigger no_free_plan_payment before insert on subscription_payments for each row execute function no_free_plan_payment();

-- Boutique autorisée par l'admin avec la formule gratuite : visible tout de suite, sans date de fin.
create or replace function activate_free_plan() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update subscriptions set active = true, current_period_end = null
      where shop_id = new.id and plan = 'decouverte';
  end if;
  return new;
end $$;
drop trigger if exists activate_free_plan on shops;
create trigger activate_free_plan after update of status on shops for each row execute function activate_free_plan();

-- Limite de produits EN LIGNE selon le forfait (Découverte 10, Base 100, Pro 1 000, Ultra illimité).
create or replace function enforce_product_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_plan plan_id;
  v_max int;
  v_count int;
begin
  if not new.published or (tg_op = 'UPDATE' and old.published) then return new; end if;
  select plan into v_plan from subscriptions where shop_id = new.shop_id;
  v_max := plan_product_limit(coalesce(v_plan, 'decouverte'));
  if v_max is null then return new; end if;
  select count(*) into v_count from products where shop_id = new.shop_id and published and id <> new.id;
  if v_count >= v_max then
    raise exception 'Limite atteinte : % produits en ligne avec votre forfait. Passez au forfait supérieur pour en publier plus.', v_max;
  end if;
  return new;
end $$;
drop trigger if exists enforce_product_limit on products;
create trigger enforce_product_limit before insert or update of published on products for each row execute function enforce_product_limit();

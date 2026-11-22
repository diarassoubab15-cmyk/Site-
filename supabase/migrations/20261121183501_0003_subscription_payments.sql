-- NEXORA · paiement des abonnements par Orange Money, avec contact obligatoire de l'administrateur
--
-- Étapes d'un paiement (chacune verrouillée par la base) :
--   contact_pending   le vendeur a demandé à payer ; il doit contacter l'admin (WhatsApp ou appel)
--   awaiting_payment  l'admin confirme l'échange : le vendeur voit alors les coordonnées et peut payer
--   declared          le vendeur a saisi le numéro de transaction Orange Money
--   confirmed         l'admin a vérifié la réception : l'abonnement est prolongé
--   rejected          l'admin n'a pas reçu l'argent (ou demande annulée)
-- Sans le passage par « awaiting_payment », décidé par l'admin seul, aucun paiement ne peut être déclaré.

create type subscription_payment_status as enum ('contact_pending', 'awaiting_payment', 'declared', 'confirmed', 'rejected');

-- Tarifs officiels, côté base : le montant n'est jamais fourni par le navigateur.
create or replace function plan_monthly_price(p plan_id) returns integer
language sql immutable set search_path = public as $$
  select case p when 'essentiel' then 4900 when 'pro' then 12900 when 'business' then 29900 end;
$$;

create table subscription_payments (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique default ('AB-' || upper(substr(md5(random()::text), 1, 6))),
  shop_id       uuid not null references shops on delete cascade,
  plan          plan_id not null,
  annual        boolean not null default false,
  amount        integer not null default 0,
  status        subscription_payment_status not null default 'contact_pending',
  operator_ref  text check (operator_ref is null or char_length(operator_ref) between 4 and 40),
  payer_phone   text check (payer_phone is null or payer_phone ~ '^[+0-9 ]{8,20}$'),
  admin_note    text check (char_length(admin_note) <= 500),
  contacted_at  timestamptz,
  declared_at   timestamptz,
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index subscription_payments_shop_idx on subscription_payments (shop_id);
-- Une seule demande en cours par boutique.
create unique index one_open_payment_per_shop on subscription_payments (shop_id)
  where status in ('contact_pending', 'awaiting_payment', 'declared');
-- Un même numéro de transaction ne peut pas servir deux fois.
create unique index operator_ref_once on subscription_payments (upper(operator_ref)) where operator_ref is not null;

-- Création : montant calculé par la base, boutique autorisée obligatoire, statut imposé.
create or replace function prepare_subscription_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare s shops%rowtype;
begin
  select * into s from shops where id = new.shop_id;
  if s.status <> 'approved' then raise exception 'La boutique doit d''abord être autorisée par l''administrateur'; end if;
  new.amount := plan_monthly_price(new.plan) * case when new.annual then 10 else 1 end; -- annuel : 2 mois offerts
  new.status := 'contact_pending';
  new.operator_ref := null; new.payer_phone := null; new.admin_note := null;
  new.contacted_at := null; new.declared_at := null; new.decided_at := null;
  return new;
end $$;
create trigger subscription_payments_prepare before insert on subscription_payments
  for each row execute function prepare_subscription_payment();

-- Mise à jour par le vendeur : uniquement déclarer son paiement, et seulement après le contact.
create or replace function guard_subscription_payment() returns trigger
language plpgsql set search_path = public as $$
begin
  if not is_end_user() or is_admin() then return new; end if;
  if (new.shop_id, new.plan, new.annual, new.amount, new.admin_note, new.contacted_at, new.decided_at, new.created_at, new.ref)
     is distinct from
     (old.shop_id, old.plan, old.annual, old.amount, old.admin_note, old.contacted_at, old.decided_at, old.created_at, old.ref) then
    raise exception 'Modification non autorisée';
  end if;
  if old.status = 'contact_pending' and new.status <> 'contact_pending' then
    raise exception 'Contactez d''abord l''administrateur sur WhatsApp ou par téléphone avant de payer';
  end if;
  if new.status = 'declared' and old.status = 'awaiting_payment' then
    if new.operator_ref is null or new.payer_phone is null then raise exception 'Numéro de transaction et téléphone obligatoires'; end if;
    new.declared_at := now();
    return new;
  end if;
  -- Le vendeur peut abandonner une demande qui n'a pas encore été payée.
  if new.status = 'rejected' and old.status in ('contact_pending', 'awaiting_payment') then
    new.admin_note := 'Annulée par le vendeur';
    new.decided_at := now();
    return new;
  end if;
  if new.status = old.status and new.operator_ref is not distinct from old.operator_ref and new.payer_phone is not distinct from old.payer_phone then
    return new;
  end if;
  raise exception 'Étape de paiement non autorisée';
end $$;
create trigger subscription_payments_guard before update on subscription_payments
  for each row execute function guard_subscription_payment();

alter table subscription_payments enable row level security;
create policy "paiements : vendeur ou admin" on subscription_payments for select
  using (is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "paiements : demande du vendeur" on subscription_payments for insert
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "paiements : vendeur déclare" on subscription_payments for update
  using (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "paiements : admin" on subscription_payments for update using (is_admin());

-- ------------------------------------------------------------------ décisions de l'administrateur
create or replace function admin_mark_contacted(p_payment uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update subscription_payments set status = 'awaiting_payment', contacted_at = now()
    where id = p_payment and status = 'contact_pending';
  if not found then raise exception 'Demande introuvable ou déjà traitée'; end if;
  insert into admin_audit (actor_id, action, target) values (auth.uid(), 'payment_contacted', p_payment::text);
end $$;

-- Paiement reçu : l'abonnement est prolongé d'un mois (ou d'un an) à partir de sa fin actuelle.
create or replace function admin_confirm_payment(p_payment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p subscription_payments%rowtype; base timestamptz;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  select * into p from subscription_payments where id = p_payment for update;
  if not found or p.status not in ('declared', 'awaiting_payment') then raise exception 'Ce paiement ne peut pas être confirmé'; end if;
  update subscription_payments set status = 'confirmed', decided_at = now() where id = p_payment;
  select greatest(coalesce(current_period_end, now()), now()) into base from subscriptions where shop_id = p.shop_id;
  insert into subscriptions (shop_id, plan, annual, active, current_period_end, provider_ref)
    values (p.shop_id, p.plan, p.annual, true, coalesce(base, now()) + case when p.annual then interval '1 year' else interval '1 month' end, p.ref)
  on conflict (shop_id) do update set plan = excluded.plan, annual = excluded.annual, active = true,
    current_period_end = excluded.current_period_end, provider_ref = excluded.provider_ref;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'payment_confirmed', p_payment::text, jsonb_build_object('amount', p.amount, 'operator_ref', p.operator_ref));
end $$;

create or replace function admin_reject_payment(p_payment uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update subscription_payments set status = 'rejected', decided_at = now(), admin_note = left(coalesce(p_note, 'Paiement non reçu'), 500)
    where id = p_payment and status in ('contact_pending', 'awaiting_payment', 'declared');
  if not found then raise exception 'Demande introuvable ou déjà traitée'; end if;
  insert into admin_audit (actor_id, action, target, details) values (auth.uid(), 'payment_rejected', p_payment::text, jsonb_build_object('note', p_note));
end $$;

-- L'autorisation de la boutique n'active plus l'abonnement : il faut un paiement confirmé.
create or replace function admin_set_shop_status(p_shop uuid, p_status shop_status, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update shops set status = p_status, status_reason = p_reason where id = p_shop;
  if p_status = 'approved' then
    update profiles set role = 'seller' where id = (select owner_id from shops where id = p_shop) and role = 'client';
  end if;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'shop_status', p_shop::text, jsonb_build_object('status', p_status, 'reason', p_reason));
end $$;

-- ------------------------------------------------------------------ boutique « en ligne »
-- Visible du public seulement si : autorisée par l'admin ET abonnement payé et non expiré.
create or replace function shop_is_live(p_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from shops s join subscriptions sub on sub.shop_id = s.id
    where s.id = p_shop and s.status = 'approved' and sub.active
      and (sub.current_period_end is null or sub.current_period_end > now()));
$$;

drop policy "boutiques autorisées visibles" on shops;
create policy "boutiques en ligne visibles" on shops for select
  using (shop_is_live(id) or owner_id = auth.uid() or is_admin());

drop policy "produits publics" on products;
create policy "produits publics" on products for select
  using (published and shop_is_live(shop_id)
         or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()) or is_admin());

drop policy "commande : acheteur connecté" on orders;
create policy "commande : acheteur connecté" on orders for insert
  with check (buyer_id = auth.uid() and shop_is_live(shop_id));

grant execute on function admin_mark_contacted(uuid) to authenticated;
grant execute on function admin_confirm_payment(uuid) to authenticated;
grant execute on function admin_reject_payment(uuid, text) to authenticated;
grant execute on function shop_is_live(uuid) to anon, authenticated;

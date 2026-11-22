-- NEXORA · forfaits Base 15 000, Pro 25 000, Ultra 50 000 FCFA par mois ;
--         l'abonnement se paie par Orange Money, Wave, MTN MoMo ou Moov Money (toujours après contact de l'admin).
-- Les identifiants internes ne changent pas (essentiel = Base, pro = Pro, business = Ultra) : abonnements en cours intacts.

create or replace function plan_monthly_price(p plan_id) returns integer
language sql immutable set search_path = public as $$
  select case p when 'essentiel' then 15000 when 'pro' then 25000 when 'business' then 50000 end;
$$;

alter table subscription_payments
  add column method payment_method not null default 'orange_money'
    check (method in ('orange_money', 'wave', 'mtn_momo', 'moov_money'));

-- Même garde qu'avant, avec le moyen de paiement : choisi à la demande, jamais modifié ensuite par le vendeur.
create or replace function guard_subscription_payment() returns trigger
language plpgsql set search_path = public as $$
begin
  if not is_end_user() or is_admin() then return new; end if;
  if (new.shop_id, new.plan, new.annual, new.amount, new.method, new.admin_note, new.contacted_at, new.decided_at, new.created_at, new.ref)
     is distinct from
     (old.shop_id, old.plan, old.annual, old.amount, old.method, old.admin_note, old.contacted_at, old.decided_at, old.created_at, old.ref) then
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

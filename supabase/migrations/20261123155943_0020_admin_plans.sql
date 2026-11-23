-- L'administrateur active, change ou désactive le forfait d'un vendeur, sans passer par un paiement
-- (cadeau, essai, paiement reçu en main propre…). Chaque geste est inscrit au journal d'administration.

create or replace function admin_set_subscription(p_shop uuid, p_plan plan_id, p_active boolean, p_months int default 1)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_end timestamptz;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  if not exists (select 1 from shops where id = p_shop) then raise exception 'Boutique introuvable'; end if;
  if p_active and (p_months is null or p_months < 1 or p_months > 24) then raise exception 'Durée invalide (1 à 24 mois)'; end if;

  if p_active then
    -- Prolonge à partir de la fin actuelle si le forfait court encore, sinon à partir d'aujourd'hui.
    select greatest(coalesce(current_period_end, now()), now()) into v_end from subscriptions where shop_id = p_shop and active;
    v_end := coalesce(v_end, now()) + make_interval(months => p_months);
    insert into subscriptions (shop_id, plan, annual, active, current_period_end, provider_ref)
      values (p_shop, p_plan, false, true, v_end, 'admin')
    on conflict (shop_id) do update set plan = excluded.plan, active = true,
      current_period_end = excluded.current_period_end, provider_ref = 'admin';
  else
    update subscriptions set active = false, current_period_end = least(coalesce(current_period_end, now()), now())
      where shop_id = p_shop;
  end if;

  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'subscription', p_shop::text,
            jsonb_build_object('plan', p_plan, 'active', p_active, 'months', case when p_active then p_months end));
end $$;

revoke execute on function admin_set_subscription(uuid, plan_id, boolean, int) from public, anon;
grant execute on function admin_set_subscription(uuid, plan_id, boolean, int) to authenticated;

-- NEXORA · récompenses des meilleurs vendeurs et mois offerts
--
-- - Classement du mois, du semestre et de l'année (ventes livrées), visible par l'admin seul.
-- - Seul l'admin récompense un vendeur et lui offre des mois gratuits (un mois précis, ex. janvier,
--   ou à la suite de son abonnement), ou retire une récompense. Aucune table n'est modifiable
--   directement : tout passe par des fonctions qui vérifient is_admin().
-- - Une boutique est en ligne si elle est autorisée ET couverte (abonnement payé OU mois offerts).
-- - Chaque vendeur voit ses propres statistiques et récompenses ; l'admin ne pilote pas son espace.

create type reward_kind as enum ('month', 'semester', 'year', 'gift');

create table rewards (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references shops on delete cascade,
  kind         reward_kind not null,
  period_key   text not null check (period_key ~ '^(\d{4}-\d{2}|\d{4}-S[12]|\d{4}|gift)$'), -- 2026-11, 2026-S2, 2026, gift
  title        text not null check (char_length(title) between 2 and 120),
  free_months  integer not null check (free_months between 0 and 12),
  starts_on    date,
  ends_on      date,
  note         text check (char_length(note) <= 500),
  granted_by   uuid references profiles on delete set null,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),
  check ((free_months = 0 and starts_on is null) or (free_months > 0 and starts_on is not null and ends_on > starts_on))
);
create index rewards_shop_idx on rewards (shop_id);
-- Un seul gagnant par période (sauf cadeaux libres) ; retirer la récompense libère la place.
create unique index one_winner_per_period on rewards (kind, period_key) where revoked_at is null and kind <> 'gift';

-- ------------------------------------------------------------------ couverture de l'abonnement
-- Date jusqu'à laquelle la boutique est couverte : fin de l'abonnement payé, prolongée par les mois
-- offerts qui la suivent sans interruption.
create or replace function shop_covered_until(p_shop uuid) returns timestamptz
language plpgsql stable security definer set search_path = public as $$
declare e timestamptz; r record;
begin
  select case when active then coalesce(current_period_end, 'infinity'::timestamptz) else null end
    into e from subscriptions where shop_id = p_shop;
  e := greatest(coalesce(e, now()), now());
  for r in select starts_on::timestamptz as s, ends_on::timestamptz as f from rewards
           where shop_id = p_shop and revoked_at is null and free_months > 0 order by starts_on loop
    if r.s <= e and r.f > e then e := r.f; end if;
  end loop;
  return e;
end $$;

create or replace function shop_is_live(p_shop uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from shops s where s.id = p_shop and s.status = 'approved')
     and (
       exists (select 1 from subscriptions sub where sub.shop_id = p_shop and sub.active
               and (sub.current_period_end is null or sub.current_period_end > now()))
       or exists (select 1 from rewards r where r.shop_id = p_shop and r.revoked_at is null and r.free_months > 0
                  and r.starts_on <= current_date and r.ends_on > current_date));
$$;

alter table rewards enable row level security;
-- Lecture : l'admin, le vendeur concerné, et le public pour les badges des boutiques en ligne.
-- Écriture : AUCUNE politique → impossible sans passer par les fonctions de l'admin ci-dessous.
create policy "récompenses : lecture" on rewards for select using (
  is_admin()
  or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
  or (revoked_at is null and kind <> 'gift' and shop_is_live(shop_id)));

-- Un paiement confirmé prolonge à partir de la fin de couverture (payée + mois offerts).
create or replace function admin_confirm_payment(p_payment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p subscription_payments%rowtype; base timestamptz;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  select * into p from subscription_payments where id = p_payment for update;
  if not found or p.status not in ('declared', 'awaiting_payment') then raise exception 'Ce paiement ne peut pas être confirmé'; end if;
  update subscription_payments set status = 'confirmed', decided_at = now() where id = p_payment;
  base := shop_covered_until(p.shop_id);
  if base = 'infinity'::timestamptz then base := now(); end if;
  insert into subscriptions (shop_id, plan, annual, active, current_period_end, provider_ref)
    values (p.shop_id, p.plan, p.annual, true, base + case when p.annual then interval '1 year' else interval '1 month' end, p.ref)
  on conflict (shop_id) do update set plan = excluded.plan, annual = excluded.annual, active = true,
    current_period_end = excluded.current_period_end, provider_ref = excluded.provider_ref;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'payment_confirmed', p_payment::text, jsonb_build_object('amount', p.amount, 'operator_ref', p.operator_ref));
end $$;

-- ------------------------------------------------------------------ actions de l'administrateur
-- p_start : premier jour du mois offert choisi (ex. 2027-01-01) ; null = à la suite de la couverture actuelle.
create or replace function admin_grant_reward(
  p_shop uuid, p_kind reward_kind, p_period_key text, p_title text, p_free_months integer, p_start date default null, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_start date; v_id uuid; st shop_status; cov timestamptz;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  select status into st from shops where id = p_shop;
  if st is null then raise exception 'Boutique introuvable'; end if;
  if st not in ('approved', 'suspended') then raise exception 'Seule une boutique autorisée peut être récompensée'; end if;
  if p_free_months < 0 or p_free_months > 12 then raise exception 'Entre 0 et 12 mois offerts'; end if;
  if p_free_months > 0 then
    cov := shop_covered_until(p_shop);
    v_start := coalesce(p_start, case when cov = 'infinity'::timestamptz then current_date else cov::date end);
    if v_start < current_date - 31 then raise exception 'Le mois offert ne peut pas être dans le passé'; end if;
  end if;
  insert into rewards (shop_id, kind, period_key, title, free_months, starts_on, ends_on, note, granted_by)
    values (p_shop, p_kind, case when p_kind = 'gift' then 'gift' else p_period_key end, p_title, p_free_months,
            v_start, case when p_free_months > 0 then (v_start + make_interval(months => p_free_months))::date end, p_note, auth.uid())
    returning id into v_id;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'reward_granted', v_id::text, jsonb_build_object('shop', p_shop, 'kind', p_kind, 'period', p_period_key, 'free_months', p_free_months, 'start', v_start));
  return v_id;
exception when unique_violation then
  raise exception 'Cette période a déjà un gagnant : retirez d''abord sa récompense';
end $$;

create or replace function admin_revoke_reward(p_reward uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update rewards set revoked_at = now(), note = coalesce(p_note, note) where id = p_reward and revoked_at is null;
  if not found then raise exception 'Récompense introuvable ou déjà retirée'; end if;
  insert into admin_audit (actor_id, action, target, details) values (auth.uid(), 'reward_revoked', p_reward::text, jsonb_build_object('note', p_note));
end $$;

-- ------------------------------------------------------------------ classements
-- Ventes LIVRÉES sur la période (les commandes annulées, remboursées ou non reçues ne comptent pas).
create or replace function admin_seller_ranking(p_from timestamptz, p_to timestamptz)
returns table (shop_id uuid, shop_name text, owner_name text, contact_phone text, delivered integer, revenue bigint, rating numeric, reviews integer, disputes integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  return query
  select s.id, s.name, s.owner_name, s.contact_phone,
    (select count(*)::int from orders o where o.shop_id = s.id and o.status = 'delivered' and o.created_at >= p_from and o.created_at < p_to),
    (select coalesce(sum(o.total), 0)::bigint from orders o where o.shop_id = s.id and o.status = 'delivered' and o.created_at >= p_from and o.created_at < p_to),
    (select round(avg(r.rating)::numeric, 1) from reviews r join products p on p.id = r.product_id where p.shop_id = s.id and r.created_at >= p_from and r.created_at < p_to),
    (select count(*)::int from reviews r join products p on p.id = r.product_id where p.shop_id = s.id and r.created_at >= p_from and r.created_at < p_to),
    (select count(*)::int from tickets t where t.shop_id = s.id and t.kind in ('refund', 'report') and t.created_at >= p_from and t.created_at < p_to)
  from shops s
  where s.status in ('approved', 'suspended')
  order by 6 desc, 7 desc nulls last, 5 desc;
end $$;

-- Statistiques du vendeur connecté sur une période, avec son rang (il ne voit pas les autres boutiques).
create or replace function seller_my_stats(p_from timestamptz, p_to timestamptz)
returns table (delivered integer, revenue bigint, open_orders integer, rating numeric, reviews integer, rank integer, competitors integer)
language plpgsql stable security definer set search_path = public as $$
declare v_shop uuid;
begin
  select id into v_shop from shops where owner_id = auth.uid() and status <> 'closed' order by created_at desc limit 1;
  if v_shop is null then return; end if;
  return query
  with sales as (
    select s.id, coalesce(sum(o.total) filter (where o.status = 'delivered' and o.created_at >= p_from and o.created_at < p_to), 0) as rev
    from shops s left join orders o on o.shop_id = s.id
    where s.status = 'approved' or s.id = v_shop group by s.id)
  select
    (select count(*)::int from orders o where o.shop_id = v_shop and o.status = 'delivered' and o.created_at >= p_from and o.created_at < p_to),
    (select rev::bigint from sales where id = v_shop),
    (select count(*)::int from orders o where o.shop_id = v_shop and o.status in ('confirmed', 'shipped', 'not_received')),
    (select round(avg(r.rating)::numeric, 1) from reviews r join products p on p.id = r.product_id where p.shop_id = v_shop),
    (select count(*)::int from reviews r join products p on p.id = r.product_id where p.shop_id = v_shop),
    (select (count(*) + 1)::int from sales where rev > (select rev from sales where id = v_shop)),
    (select count(*)::int from sales);
end $$;

revoke all on function admin_grant_reward(uuid, reward_kind, text, text, integer, date, text) from public, anon;
revoke all on function admin_revoke_reward(uuid, text) from public, anon;
revoke all on function admin_seller_ranking(timestamptz, timestamptz) from public, anon;
revoke all on function seller_my_stats(timestamptz, timestamptz) from public, anon;
grant execute on function admin_grant_reward(uuid, reward_kind, text, text, integer, date, text) to authenticated;
grant execute on function admin_revoke_reward(uuid, text) to authenticated;
grant execute on function admin_seller_ranking(timestamptz, timestamptz) to authenticated;
grant execute on function seller_my_stats(timestamptz, timestamptz) to authenticated;
grant execute on function shop_covered_until(uuid) to authenticated;

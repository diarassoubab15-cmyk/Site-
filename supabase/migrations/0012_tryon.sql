-- NEXORA · essayage virtuel des vêtements : compteur d'essais par client et par boutique.
-- La PHOTO du client n'est jamais enregistrée ici (ni ailleurs chez NEXORA) : seul l'essai est compté.
--   Base (essentiel) : 5 essais par client et par boutique · Pro : 15 · Ultra (business) : illimité.

create table tryons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles on delete cascade,
  shop_id     uuid not null references shops on delete cascade,
  product_ids uuid[] not null check (cardinality(product_ids) between 1 and 3),
  status      text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  created_at  timestamptz not null default now()
);
create index tryons_user_shop_idx on tryons (user_id, shop_id);

alter table tryons enable row level security;
-- Lecture de ses propres essais seulement ; aucune écriture directe (fonctions ci-dessous).
create policy "essais : les siens" on tryons for select using (user_id = auth.uid());

create or replace function tryon_quota(p_shop uuid) returns integer
language sql stable security definer set search_path = public as $$
  select case coalesce((select plan from subscriptions where shop_id = p_shop), 'essentiel')
           when 'business' then null when 'pro' then 15 else 5 end;
$$;

-- Essais restants pour le client connecté dans cette boutique (null = illimité).
create or replace function tryon_remaining(p_shop uuid) returns integer
language sql stable security definer set search_path = public as $$
  select case when tryon_quota(p_shop) is null then null
              else greatest(0, tryon_quota(p_shop) - (select count(*)::int from tryons where user_id = auth.uid() and shop_id = p_shop and status <> 'failed')) end;
$$;

-- Réserve un essai (quota vérifié de façon atomique) : vêtements publiés de cette boutique, catégorie Vêtements.
create or replace function claim_tryon(p_shop uuid, p_products uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_left integer;
begin
  if auth.uid() is null then raise exception 'Connectez-vous pour essayer'; end if;
  if cardinality(p_products) not between 1 and 3 then raise exception 'Choisissez 1 à 3 vêtements'; end if;
  if exists (select 1 from unnest(p_products) pid
             where not exists (select 1 from products p where p.id = pid and p.shop_id = p_shop and p.published and p.category = 'mode')) then
    raise exception 'Vêtement introuvable dans cette boutique';
  end if;
  if not shop_is_live(p_shop) then raise exception 'Boutique indisponible'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text || p_shop::text));
  v_left := tryon_remaining(p_shop);
  if v_left is not null and v_left <= 0 then raise exception 'Vous avez utilisé tous vos essais dans cette boutique'; end if;
  insert into tryons (user_id, shop_id, product_ids) values (auth.uid(), p_shop, p_products) returning id into v_id;
  return v_id;
end $$;

-- Fin d'essai : réussi, ou échoué (l'essai est alors rendu au client).
create or replace function finish_tryon(p_id uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update tryons set status = case when p_ok then 'done' else 'failed' end
    where id = p_id and user_id = auth.uid() and status = 'pending' and created_at > now() - interval '15 minutes';
end $$;

revoke execute on function claim_tryon(uuid, uuid[]), finish_tryon(uuid, boolean), tryon_remaining(uuid), tryon_quota(uuid) from public, anon;
grant execute on function claim_tryon(uuid, uuid[]), finish_tryon(uuid, boolean), tryon_remaining(uuid) to authenticated;

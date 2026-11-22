-- NEXORA · modifications de fiche demandées par écrit
--
--   1. Le vendeur écrit ce qu'il veut changer (« baisse le prix à 15 000, ajoute que c'est fait main »).
--   2. Le serveur prépare une proposition (avec l'IA si elle est configurée) : seulement les champs à changer.
--   3. L'admin relit, corrige si besoin, puis applique ou refuse. Rien ne change sur la fiche sans lui.
--
-- Le vendeur ne peut ni écrire la proposition, ni l'appliquer : seulement demander et annuler.

create type edit_status as enum ('review', 'applied', 'rejected', 'cancelled');

create table product_edit_requests (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products on delete cascade,
  shop_id     uuid not null references shops on delete cascade,
  author_id   uuid references profiles on delete set null default auth.uid(),
  message     text not null check (char_length(message) between 5 and 1000),
  status      edit_status not null default 'review',
  proposal    jsonb,                      -- champs à changer, préparés par le serveur
  ai          boolean not null default false,
  applied     jsonb,                      -- ce que l'admin a réellement appliqué
  admin_note  text check (char_length(admin_note) <= 500),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create index product_edit_requests_shop_idx on product_edit_requests (shop_id, created_at desc);
create index product_edit_requests_review_idx on product_edit_requests (created_at) where status = 'review';

-- Création par le vendeur : sa boutique autorisée, champs serveur remis à zéro, limites anti-abus.
create or replace function prepare_edit_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_shop uuid; v_open integer; v_month integer;
begin
  select p.shop_id into v_shop from products p where p.id = new.product_id;
  if v_shop is null then raise exception 'Produit introuvable'; end if;
  new.shop_id := v_shop;
  if is_site_user() and not is_admin() then
    if not exists (select 1 from shops where id = v_shop and owner_id = auth.uid() and status = 'approved') then
      raise exception 'Votre boutique doit être autorisée';
    end if;
    new.author_id := auth.uid();
    new.status := 'review'; new.proposal := null; new.ai := false;
    new.applied := null; new.admin_note := null; new.decided_at := null; new.created_at := now();
    select count(*) filter (where status = 'review'), count(*) filter (where created_at > now() - interval '30 days')
      into v_open, v_month from product_edit_requests where shop_id = v_shop;
    if v_open >= 5 then raise exception 'Déjà 5 demandes en attente : patientez jusqu''à leur traitement'; end if;
    if v_month >= 30 then raise exception 'Limite de 30 demandes par mois atteinte'; end if;
  end if;
  return new;
end $$;
create trigger product_edit_requests_prepare before insert on product_edit_requests
  for each row execute function prepare_edit_request();

-- Le vendeur peut seulement annuler une demande en attente. La proposition est écrite par le serveur.
create or replace function guard_edit_request() returns trigger
language plpgsql set search_path = public as $$
begin
  if not is_site_user() or is_admin() then return new; end if;
  if old.status = 'review' and new.status = 'cancelled'
     and (new.product_id, new.shop_id, new.author_id, new.message, new.proposal, new.ai, new.applied, new.admin_note, new.created_at)
         is not distinct from (old.product_id, old.shop_id, old.author_id, old.message, old.proposal, old.ai, old.applied, old.admin_note, old.created_at) then
    new.decided_at := now();
    return new;
  end if;
  raise exception 'Vous pouvez seulement annuler une demande en attente';
end $$;
create trigger product_edit_requests_guard before update on product_edit_requests
  for each row execute function guard_edit_request();

alter table product_edit_requests enable row level security;
create policy "modifications : vendeur et admin" on product_edit_requests for select using (
  is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "modifications : demande du vendeur" on product_edit_requests for insert with check (
  exists (select 1 from products p join shops s on s.id = p.shop_id
          where p.id = product_id and s.owner_id = auth.uid() and s.status = 'approved'));
create policy "modifications : annulation par le vendeur" on product_edit_requests for update using (
  exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
-- pas de suppression : l'historique reste

-- ------------------------------------------------------------------ décision de l'admin
-- p_changes ne contient que les champs à changer : name, short, description, price, compareAt, specs.
-- compareAt à null retire l'ancien prix barré.
create or replace function admin_apply_edit(p_request uuid, p_changes jsonb, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r product_edit_requests%rowtype; p products%rowtype; k text; v_price integer; v_compare integer;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  select * into r from product_edit_requests where id = p_request for update;
  if not found or r.status <> 'review' then raise exception 'Cette demande n''est plus en attente'; end if;
  if jsonb_typeof(p_changes) <> 'object' or p_changes = '{}'::jsonb then raise exception 'Aucun changement à appliquer'; end if;
  for k in select jsonb_object_keys(p_changes) loop
    if k not in ('name', 'short', 'description', 'price', 'compareAt', 'specs') then raise exception 'Champ non modifiable : %', k; end if;
  end loop;
  if p_changes ? 'specs' and (jsonb_typeof(p_changes->'specs') <> 'array' or jsonb_array_length(p_changes->'specs') > 20
      or exists (select 1 from jsonb_array_elements(p_changes->'specs') e
                 where jsonb_typeof(e) <> 'array' or jsonb_array_length(e) <> 2
                    or char_length(e->>0) not between 1 and 40 or char_length(e->>1) not between 1 and 120)) then
    raise exception 'Caractéristiques invalides';
  end if;

  select * into p from products where id = r.product_id for update;
  v_price := case when p_changes ? 'price' then (p_changes->>'price')::integer else p.price end;
  v_compare := case when p_changes ? 'compareAt' then (p_changes->>'compareAt')::integer else p.compare_at end;
  if v_compare is not null and v_compare <= v_price then v_compare := null; end if;   -- un prix barré plus bas n'a pas de sens

  update products set
    name        = case when p_changes ? 'name' then p_changes->>'name' else name end,
    short       = case when p_changes ? 'short' then nullif(p_changes->>'short', '') else short end,
    description = case when p_changes ? 'description' then nullif(p_changes->>'description', '') else description end,
    specs       = case when p_changes ? 'specs' then p_changes->'specs' else specs end,
    price       = v_price,
    compare_at  = v_compare
  where id = r.product_id;

  update product_edit_requests set status = 'applied', applied = p_changes, decided_at = now(), admin_note = left(p_note, 500) where id = p_request;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'product_edit_applied', r.product_id::text, jsonb_build_object('request', p_request, 'changes', p_changes));
end $$;

create or replace function admin_reject_edit(p_request uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update product_edit_requests set status = 'rejected', decided_at = now(), admin_note = left(coalesce(p_note, 'Demande refusée'), 500)
    where id = p_request and status = 'review';
  if not found then raise exception 'Cette demande n''est plus en attente'; end if;
  insert into admin_audit (actor_id, action, target, details) values (auth.uid(), 'product_edit_rejected', p_request::text, jsonb_build_object('note', p_note));
end $$;

revoke execute on function admin_apply_edit(uuid, jsonb, text), admin_reject_edit(uuid, text) from anon;

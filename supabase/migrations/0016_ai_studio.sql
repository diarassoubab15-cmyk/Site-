-- NEXORA · Studio IA (forfait Ultra) : le vendeur décrit ce qu'il veut en quelques mots,
-- l'IA crée des images et des vidéos pour sa boutique. Il choisit ensuite lesquelles publier.
--   Quota par boutique et par mois civil : 30 images et 4 vidéos (forfait Ultra en cours uniquement).
--   Une création ratée est rendue (elle ne compte pas).

create table ai_creations (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references shops on delete cascade,
  kind        text not null check (kind in ('image', 'video')),
  prompt      text not null check (char_length(prompt) between 3 and 600),
  source_id   uuid references ai_creations on delete set null,   -- vidéo animée à partir d'une image créée
  status      text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  request_id  text,                                              -- identifiant de la tâche chez le fournisseur
  path        text,                                              -- fichier dans le stockage « shop-ai »
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index ai_creations_shop_idx on ai_creations (shop_id, created_at desc);

alter table ai_creations enable row level security;
-- Le vendeur voit toutes ses créations ; le public ne voit que celles publiées d'une boutique en ligne.
create policy "studio : le vendeur" on ai_creations for select using (shop_id in (select id from shops where owner_id = auth.uid()));
create policy "studio : publiées" on ai_creations for select using (published and status = 'done' and shop_is_live(shop_id));

create or replace function ai_quota(p_kind text) returns integer language sql immutable as $$
  select case p_kind when 'video' then 4 else 30 end;
$$;

-- La boutique (non fermée) du vendeur connecté : une seule par vendeur dans l'application.
create or replace function my_shop() returns uuid
language sql stable security definer set search_path = public as $$
  select id from shops where owner_id = auth.uid() and status <> 'closed' order by created_at desc limit 1;
$$;

-- Créations restantes ce mois-ci pour la boutique du vendeur connecté (0 hors forfait Ultra en cours).
create or replace function ai_remaining(p_kind text) returns integer
language sql stable security definer set search_path = public as $$
  select case when my_shop() is null or not shop_is_live(my_shop())
                or coalesce((select plan from subscriptions where shop_id = my_shop()), 'essentiel') <> 'business' then 0
              else greatest(0, ai_quota(p_kind) - (select count(*)::int from ai_creations c
                     where c.shop_id = my_shop() and c.kind = p_kind and c.status <> 'failed'
                       and c.created_at >= date_trunc('month', now()))) end;
$$;

-- Réserve une création (quota vérifié de façon atomique) et renvoie son identifiant.
create or replace function claim_ai_creation(p_kind text, p_prompt text, p_source uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_shop uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Connectez-vous'; end if;
  v_shop := my_shop();
  if v_shop is null then raise exception 'Aucune boutique'; end if;
  if p_kind not in ('image', 'video') then raise exception 'Type inconnu'; end if;
  if char_length(coalesce(p_prompt, '')) not between 3 and 600 then raise exception 'Décrivez ce que vous voulez (3 à 600 caractères)'; end if;
  if p_source is not null and not exists (select 1 from ai_creations where id = p_source and shop_id = v_shop and kind = 'image' and status = 'done') then
    raise exception 'Image de départ introuvable';
  end if;
  perform pg_advisory_xact_lock(hashtext('ai' || v_shop::text));
  if ai_remaining(p_kind) <= 0 then
    raise exception 'Studio IA : réservé au forfait Ultra, ou quota du mois atteint';
  end if;
  insert into ai_creations (shop_id, kind, prompt, source_id) values (v_shop, p_kind, p_prompt, p_source) returning id into v_id;
  return v_id;
end $$;

-- Publier / retirer une création terminée sur la page de la boutique.
create or replace function set_ai_published(p_id uuid, p_published boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update ai_creations set published = p_published
    where id = p_id and status = 'done' and shop_id in (select id from shops where owner_id = auth.uid());
  if not found then raise exception 'Création introuvable'; end if;
end $$;

-- L'avancement (request_id, résultat, échec) n'est écrit que par le serveur (clé de service) : aucune écriture directe.
revoke all on ai_creations from anon, authenticated;
grant select on ai_creations to anon, authenticated;
revoke execute on function my_shop(), ai_remaining(text), claim_ai_creation(text, text, uuid), set_ai_published(uuid, boolean) from public, anon;
grant execute on function ai_remaining(text), claim_ai_creation(text, text, uuid), set_ai_published(uuid, boolean) to authenticated;

-- Stockage public des créations (écrit seulement par le serveur).
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('shop-ai', 'shop-ai', true, 52428800, array['image/jpeg', 'image/webp', 'image/png', 'video/mp4'])
      on conflict (id) do nothing;
  end if;
end $$;

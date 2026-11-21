-- NEXORA · vidéos de boutique générées à partir d'une description (HyperFrames + IA)
--
-- Parcours : le vendeur décrit sa boutique → demande en file d'attente (queued) → le programme de
-- fabrication la prend (rendering), écrit le script, rend la vidéo et la dépose → l'admin la valide
-- (review → approved) ou la refuse → la vidéo validée s'affiche sur la boutique.
-- Quotas mensuels selon le forfait : Essentiel 1, Pro 3, Business 10.

create type video_status as enum ('queued', 'rendering', 'review', 'approved', 'rejected', 'failed', 'cancelled');

create or replace function plan_video_quota(p plan_id) returns integer
language sql immutable set search_path = public as $$
  select case p when 'essentiel' then 1 when 'pro' then 3 when 'business' then 10 else 0 end;
$$;

create table shop_videos (
  id           uuid primary key default gen_random_uuid(),
  ref          text not null unique default ('VD-' || upper(substr(md5(random()::text), 1, 6))),
  shop_id      uuid not null references shops on delete cascade,
  description  text not null check (char_length(description) between 20 and 1500),
  status       video_status not null default 'queued',
  script       jsonb,                 -- textes et choix visuels produits à partir de la description
  video_path   text,                  -- chemin dans le stockage « shop-videos »
  poster_path  text,
  duration_s   numeric(5, 2),
  attempts     integer not null default 0,
  error        text check (char_length(error) <= 1000),
  admin_note   text check (char_length(admin_note) <= 500),
  is_active    boolean not null default false,  -- la vidéo affichée sur la boutique
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  rendered_at  timestamptz,
  decided_at   timestamptz
);
create index shop_videos_shop_idx on shop_videos (shop_id, created_at desc);
create index shop_videos_queue_idx on shop_videos (created_at) where status = 'queued';
-- Une seule fabrication en cours par boutique.
create unique index one_video_in_progress on shop_videos (shop_id) where status in ('queued', 'rendering');
-- Une seule vidéo affichée par boutique.
create unique index one_active_video on shop_videos (shop_id) where is_active;

-- Demande : boutique en ligne obligatoire, quota du forfait vérifié par la base, champs imposés.
create or replace function prepare_shop_video() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_plan plan_id; v_used integer; v_quota integer;
begin
  if not shop_is_live(new.shop_id) then
    raise exception 'Votre boutique doit être en ligne (autorisée et abonnement à jour) pour créer une vidéo';
  end if;
  select plan into v_plan from subscriptions where shop_id = new.shop_id;
  v_quota := plan_video_quota(coalesce(v_plan, 'essentiel'));
  select count(*) into v_used from shop_videos
    where shop_id = new.shop_id and status <> 'failed'
      and created_at >= date_trunc('month', now());
  if v_used >= v_quota then
    raise exception 'Quota atteint : % vidéo(s) par mois avec votre forfait', v_quota;
  end if;
  new.status := 'queued';
  new.script := null; new.video_path := null; new.poster_path := null; new.duration_s := null;
  new.attempts := 0; new.error := null; new.admin_note := null; new.is_active := false;
  new.started_at := null; new.rendered_at := null; new.decided_at := null;
  return new;
end $$;
create trigger shop_videos_prepare before insert on shop_videos
  for each row execute function prepare_shop_video();

-- Le vendeur peut seulement annuler une demande encore en file. Tout le reste passe par
-- le programme de fabrication (clé serveur) ou par les fonctions de l'admin.
create or replace function guard_shop_video() returns trigger
language plpgsql set search_path = public as $$
begin
  if not is_end_user() or is_admin() then return new; end if;
  if old.status = 'queued' and new.status = 'cancelled'
     and (new.description, new.script, new.video_path, new.is_active) is not distinct from (old.description, old.script, old.video_path, old.is_active) then
    return new;
  end if;
  raise exception 'Modification non autorisée';
end $$;
create trigger shop_videos_guard before update on shop_videos
  for each row execute function guard_shop_video();

alter table shop_videos enable row level security;
create policy "vidéos : vendeur, admin, ou public si validée" on shop_videos for select using (
  is_admin()
  or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
  or (status = 'approved' and is_active and shop_is_live(shop_id)));
create policy "vidéos : demande du vendeur" on shop_videos for insert
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "vidéos : annulation par le vendeur" on shop_videos for update
  using (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- ------------------------------------------------------------------ validation par l'admin
create or replace function admin_review_video(p_video uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v shop_videos%rowtype;
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  select * into v from shop_videos where id = p_video for update;
  if not found or v.status <> 'review' then raise exception 'Cette vidéo n''est pas en attente de validation'; end if;
  if p_approve then
    update shop_videos set is_active = false where shop_id = v.shop_id and is_active;
    update shop_videos set status = 'approved', is_active = true, decided_at = now(), admin_note = p_note where id = p_video;
  else
    update shop_videos set status = 'rejected', decided_at = now(), admin_note = left(coalesce(p_note, 'Vidéo refusée'), 500) where id = p_video;
  end if;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), case when p_approve then 'video_approved' else 'video_rejected' end, p_video::text, jsonb_build_object('note', p_note));
end $$;

-- L'admin retire une vidéo déjà publiée.
create or replace function admin_unpublish_video(p_video uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update shop_videos set is_active = false, status = 'rejected', decided_at = now(), admin_note = left(coalesce(p_note, 'Retirée par l''administrateur'), 500)
    where id = p_video and status = 'approved';
  if not found then raise exception 'Vidéo introuvable ou non publiée'; end if;
  insert into admin_audit (actor_id, action, target, details) values (auth.uid(), 'video_unpublished', p_video::text, jsonb_build_object('note', p_note));
end $$;

-- ------------------------------------------------------------------ programme de fabrication (clé serveur seulement)
-- Prend la plus ancienne demande en file, sans conflit si plusieurs programmes tournent.
create or replace function claim_next_video() returns setof shop_videos
language plpgsql security definer set search_path = public as $$
begin
  -- Double verrou : en plus du retrait des droits ci-dessous, refuse tout appel d'un utilisateur du site.
  -- (Dans une fonction « security definer », current_user est le propriétaire : on lit donc le rôle de la connexion.)
  if coalesce(nullif(current_setting('role', true), ''), 'none') in ('anon', 'authenticated') then
    raise exception 'Réservé au programme de fabrication';
  end if;
  return query
  update shop_videos set status = 'rendering', started_at = now(), attempts = attempts + 1
  where id = (select id from shop_videos where status = 'queued' order by created_at for update skip locked limit 1)
  returning *;
end $$;

revoke all on function claim_next_video() from public, anon, authenticated;
revoke all on function admin_review_video(uuid, boolean, text) from public, anon;
revoke all on function admin_unpublish_video(uuid, text) from public, anon;
grant execute on function admin_review_video(uuid, boolean, text) to authenticated;
grant execute on function admin_unpublish_video(uuid, text) to authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function claim_next_video() to service_role;
  end if;
end $$;

-- ------------------------------------------------------------------ stockage des fichiers vidéo
-- Dossier public en lecture (les chemins sont imprévisibles et seules les vidéos validées sont référencées
-- par le site) ; écriture réservée au programme de fabrication (clé serveur, qui contourne la RLS).
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('shop-videos', 'shop-videos', true, 20971520, array['video/mp4', 'image/jpeg'])
      on conflict (id) do nothing;
  end if;
end $$;

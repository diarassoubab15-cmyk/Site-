-- NEXORA · lien personnalisé de chaque boutique (ex. nexora…/b/bazin-bamako), à partager à ses clients.
-- Le vendeur peut choisir l'adresse de sa boutique ; les anciennes adresses restent valables
-- (elles redirigent vers la nouvelle), pour que les liens déjà partagés ne cassent jamais.

create table shop_aliases (
  slug       text primary key,
  shop_id    uuid not null references shops on delete cascade,
  created_at timestamptz not null default now()
);
create index shop_aliases_shop_idx on shop_aliases (shop_id);
alter table shop_aliases enable row level security;
-- Aucun accès direct : la résolution passe par resolve_shop_slug(), l'écriture par set_shop_slug().
revoke all on shop_aliases from anon, authenticated;

-- Adresses réservées (pages du site, mots trompeurs).
create or replace function reserved_slug(p text) returns boolean language sql immutable as $$
  select p = any (array['admin','api','auth','b','boutique','boutiques','categories','compte','connexion','conditions','confidentialite',
    'marketplace','produits','reglages','securite','support','tarifs','vendeur','vendre','award','nexora','officiel','sav','aide','paiement','login']);
$$;

-- Choisir l'adresse de sa boutique (3 à 40 caractères : lettres minuscules, chiffres, tirets).
create or replace function set_shop_slug(p_slug text) returns text
language plpgsql security definer set search_path = public as $$
declare v_shop uuid; v_old text; v_new text := lower(trim(p_slug)); v_changes int;
begin
  if auth.uid() is null then raise exception 'Connectez-vous'; end if;
  v_shop := my_shop();
  if v_shop is null then raise exception 'Aucune boutique'; end if;
  if v_new !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(v_new) not between 3 and 40 then
    raise exception 'Adresse invalide : 3 à 40 caractères, lettres minuscules, chiffres et tirets';
  end if;
  if reserved_slug(v_new) then raise exception 'Cette adresse est réservée'; end if;
  select slug into v_old from shops where id = v_shop;
  if v_old = v_new then return v_new; end if;
  perform pg_advisory_xact_lock(hashtext('slug:' || v_new));
  if exists (select 1 from shops where slug = v_new and id <> v_shop)
     or exists (select 1 from shop_aliases where slug = v_new and shop_id <> v_shop) then
    raise exception 'Cette adresse est déjà prise';
  end if;
  -- Pas plus de 3 changements par mois (évite les liens qui changent sans cesse).
  select count(*) into v_changes from shop_aliases where shop_id = v_shop and created_at > now() - interval '30 days';
  if v_changes >= 3 then raise exception 'Vous avez déjà changé d''adresse 3 fois ce mois-ci'; end if;
  delete from shop_aliases where slug = v_new and shop_id = v_shop;            -- retour à une ancienne adresse
  insert into shop_aliases (slug, shop_id) values (v_old, v_shop) on conflict (slug) do nothing;
  update shops set slug = v_new where id = v_shop;
  return v_new;
end $$;

-- Adresse actuelle d'une boutique à partir d'une ancienne adresse (null si inconnue).
create or replace function resolve_shop_slug(p_slug text) returns text
language sql stable security definer set search_path = public as $$
  select s.slug from shop_aliases a join shops s on s.id = a.shop_id where a.slug = lower(p_slug) and s.status = 'approved';
$$;

revoke execute on function set_shop_slug(text), resolve_shop_slug(text), reserved_slug(text) from public;
grant execute on function set_shop_slug(text) to authenticated;
grant execute on function resolve_shop_slug(text) to anon, authenticated;

-- NEXORA · renforcement de la sécurité (audit Supabase + double vérification de l'administrateur).

-- 1. Les visiteurs non connectés ne peuvent plus appeler les fonctions réservées (administration, vendeurs).
--    Elles vérifiaient déjà le rôle à l'intérieur ; on retire en plus l'accès à la porte d'entrée.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'admin\_%' or p.proname in (
      'close_my_shop', 'set_shop_slug', 'claim_ai_creation', 'set_ai_published', 'ai_remaining', 'my_shop',
      'claim_tryon', 'finish_tryon', 'tryon_remaining', 'tryon_quota', 'seller_my_stats', 'shop_covered_until'))
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
  end loop;
end $$;

-- 2. Chemin de recherche figé pour les petites fonctions signalées par l'audit.
alter function valid_sample_prices(jsonb) set search_path = public;
alter function ai_quota(text) set search_path = public;
alter function reserved_slug(text) set search_path = public;

-- 3. Administrateur : dès qu'il a activé la double vérification (code à 6 chiffres d'une application),
--    ses droits d'administration exigent une session vérifiée avec ce code (niveau « aal2 »).
--    Un mot de passe volé ne suffit donc plus pour agir en administrateur, même en appelant l'API directement.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
     and (coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
          or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified'));
$$;

-- 4. Tentatives de connexion par mot de passe ratées, par connexion internet (empreinte de l'adresse IP) :
--    au-delà de 10 en une heure, le site refuse toute tentative depuis cette connexion.
create table login_attempts (
  id         bigint generated always as identity primary key,
  ip_hash    text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index login_attempts_ip_idx on login_attempts (ip_hash, created_at desc);
alter table login_attempts enable row level security;
revoke all on login_attempts from anon, authenticated;

-- Réglages privés de l'administrateur (ex. numéro Wave pour les abonnements).
-- Aucune politique RLS : seul le client « service » du serveur peut les lire.
-- Les valeurs sont saisies directement dans la base, jamais dans le code.
create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.admin_settings enable row level security;
revoke all on public.admin_settings from anon, authenticated;

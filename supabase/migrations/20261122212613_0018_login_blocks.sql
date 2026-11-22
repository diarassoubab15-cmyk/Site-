-- NEXORA · connexion : une seule erreur de mot de passe bloque cet appareil pour ce compte.
-- L'appareil est reconnu par un identifiant aléatoire gardé dans un cookie protégé (pas d'empreinte du téléphone).
-- Le compte est désigné par l'empreinte (SHA-256) de son e-mail : aucune adresse en clair ici.
-- Déblocage : le lien « Mot de passe oublié » (ou un lien de connexion) ouvert sur cet appareil prouve
-- que c'est le propriétaire du compte, et supprime le blocage.

create table login_blocks (
  device_id  uuid not null,
  email_hash text not null check (email_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (device_id, email_hash)
);
create index login_blocks_email_idx on login_blocks (email_hash);

-- Lu et écrit uniquement par le serveur du site (clé de service) : aucun accès depuis le navigateur.
alter table login_blocks enable row level security;
revoke all on login_blocks from anon, authenticated;

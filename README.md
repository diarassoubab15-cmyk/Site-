# NEXORA

Marketplace africaine : vendeurs vérifiés par l'administrateur, paiement Orange Money / Wave / MTN MoMo / Moov / carte **ou à la livraison**, argent versé **directement au vendeur**, 0 % de commission.

Design inspiré d'une esthétique « développeur » sombre (fond noir, bordures fines, accent violet), avec une identité, des textes et un logo propres à NEXORA.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # vérification de production
```

Copier `.env.example` en `.env.local` et remplir les valeurs.

## Pages

| URL | Rôle |
|---|---|
| `/` | Accueil |
| `/marketplace`, `/marketplace/[catégorie]` | Catalogue, recherche (URL partageable `?q=`) |
| `/produits/[slug]` | Fiche produit, commande, avis vérifiés |
| `/boutiques/[slug]` | Page vendeur, signalement |
| `/tarifs` | 3 forfaits payants (Essentiel, Pro, Business), mensuel / annuel |
| `/vendre` | Demande d'ouverture en 4 étapes (brouillon auto) |
| `/connexion` | Code par e-mail ou SMS, Google. Sans mot de passe |
| `/compte` | Commandes, « J'ai reçu » / « Pas reçu », SAV, notifications, export / suppression |
| `/vendeur` | Statut, comptes d'encaissement, fermeture de boutique |
| `/admin` | **Admin unique** : autoriser / refuser / suspendre les vendeurs, litiges |
| `/support` | WhatsApp, e-mail, formulaire vers l'admin, protection acheteur |
| `/securite`, `/confidentialite`, `/conditions` | Informations (textes légaux à faire relire) |

## État actuel : mode démo

Les données de catalogue sont dans `lib/data.ts`. Les actions (commandes, avis, demandes vendeur, décisions admin…) sont enregistrées dans le `localStorage` du navigateur via `lib/demo-store.ts`. **Rien n'est encore partagé entre utilisateurs** : c'est l'étape suivante.

`/admin` est verrouillé par `middleware.ts` (identifiant + mot de passe `ADMIN_USER` / `ADMIN_PASSWORD`). Sans ces variables, `/admin` renvoie 404 en production.

## Brancher Supabase

C'est la suite du projet.

1. **Créer le projet** sur supabase.com (région la plus proche de vos clients), puis remplir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`.
2. **Créer les tables** : exécuter `supabase/migrations/0001_init.sql` dans l'éditeur SQL. Il crée toutes les tables avec la Row Level Security activée :
   - un seul compte `admin` possible (index unique) ;
   - seul l'admin change le statut d'une boutique (trigger) ; le vendeur peut seulement la fermer ;
   - produits visibles uniquement si la boutique est `approved` ;
   - avis autorisés uniquement sur une commande `delivered` de l'auteur ;
   - comptes d'encaissement lisibles par leur seul propriétaire (stockage d'un jeton + 4 derniers chiffres) ;
   - `close_my_shop(...)` supprime comptes de paiement / abonnement ; `admin_set_shop_status(...)` est journalisé.
3. **Authentification** (Authentication → Providers) : activer *Email OTP*, *Phone* (fournisseur SMS) et *Google*. Limiter le débit des codes (Rate limits).
4. **Désigner l'admin** : après votre première connexion, dans l'éditeur SQL :
   ```sql
   update profiles set role = 'admin' where id = (select id from auth.users where email = 'VOTRE_EMAIL');
   ```
5. **Brancher le code** : `npm install @supabase/supabase-js @supabase/ssr`, puis
   - remplacer les fonctions de `lib/data.ts` par des requêtes Supabase (les pages n'ont pas à changer) ;
   - remplacer `update(...)` de `lib/demo-store.ts` par des Server Actions qui écrivent dans Supabase ;
   - dans `middleware.ts`, remplacer le mot de passe par la vérification de session + `role = 'admin'` ;
   - retirer `<DemoNotice />`.
6. **Paiements**
   - *Abonnements* (payés à NEXORA) : agrégateur acceptant Orange Money, Wave, MTN, Moov et carte (ex. CinetPay, PayDunya, Flutterwave). Webhook → `subscriptions.active = true`.
   - *Commandes* (payées au vendeur) : chaque vendeur connecte **son propre** compte marchand. Le paiement va sur ce compte, jamais sur celui de NEXORA. Le paiement à la livraison ne passe par aucun prestataire.
7. **E-mails** : service transactionnel (`EMAIL_API_KEY`). Avant chaque envoi, lire `notification_preferences`. Les codes de connexion et alertes de sécurité ne sont pas désactivables.
8. **Litiges** : tâche planifiée (Supabase Cron) qui alerte l'admin quand `tickets.seller_deadline` (72 h) est dépassé.

À faire avant la mise en ligne : vrai numéro WhatsApp et e-mails dans `lib/site.ts`, `NEXT_PUBLIC_SITE_URL`, relecture juridique des pages légales, photos produits (Supabase Storage).

Voir aussi `docs/DECISIONS.md`.

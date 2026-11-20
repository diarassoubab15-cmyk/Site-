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

## Deux modes de fonctionnement

| | Mode démo | Mode Supabase |
|---|---|---|
| Quand | `NEXT_PUBLIC_SUPABASE_URL` vide | URL et clé Supabase renseignées |
| Catalogue | `lib/data.ts` | tables `products`, `shops`, `reviews` |
| Actions | `localStorage` du navigateur | Server Actions (`app/actions.ts`) + règles de la base |
| Connexion | code fictif (6 chiffres) | vrai code par e-mail / SMS, Google |
| `/admin` | `ADMIN_USER` / `ADMIN_PASSWORD` (404 en production sans eux) | compte au rôle `admin` uniquement, 404 pour tous les autres |

## Tester en local avec Supabase

Il faut Docker.

```bash
npm run db:start        # base, API, authentification, boîte mail de test (http://127.0.0.1:54324)
```

Copier les clés affichées dans `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), puis `npm run dev`. Les codes de connexion arrivent dans la boîte mail de test.

- `npm run db:reset` : recrée la base (migrations + données de démo de `supabase/seed.sql`).
- `npm run db:seed:generate` : régénère `seed.sql` à partir de `lib/data.ts`.
- `npm run db:types` : régénère les types TypeScript après une modification du schéma.
- `supabase/tests/` : 14 scénarios d'attaque à rejouer sur la base (voir son README).

## Mettre en ligne avec Supabase

1. **Créer le projet** sur supabase.com (région la plus proche de vos clients).
2. **Créer les tables** : exécuter dans l'éditeur SQL `supabase/migrations/0001_init.sql` puis `0002_app.sql`. Ne **pas** exécuter `seed.sql` (données de démonstration).
3. **Variables** sur l'hébergeur : `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secrète, jamais côté navigateur).
4. **Authentification** (Authentication) :
   - *URL Configuration* : Site URL = votre domaine ; Redirect URLs = `https://votre-domaine/auth/callback`.
   - *Email Templates* : coller `supabase/templates/code.html` dans « Magic Link » et « Confirm signup » (le code à 6 chiffres remplace le lien).
   - *Providers* : Email (activé), Phone (choisir un fournisseur SMS), Google (identifiants OAuth Google).
   - *Rate Limits* : garder des limites basses sur l'envoi de codes.
   - *SMTP* : brancher un service d'envoi (le service intégré de Supabase est limité à quelques e-mails par heure).
5. **Désigner l'admin** : se connecter une fois sur le site, puis dans l'éditeur SQL :
   ```sql
   update profiles set role = 'admin' where email = 'VOTRE_EMAIL';
   ```
   La base n'accepte qu'un seul admin.

### Ce que garantit la base (testé)

- un seul compte `admin` ; personne ne peut changer son propre rôle ;
- seul l'admin autorise, refuse ou suspend une boutique (journalisé dans `admin_audit`) ; le vendeur peut seulement fermer la sienne ;
- une boutique non autorisée n'apparaît nulle part et ne peut pas publier de produits ;
- le total d'une commande est recalculé par la base (prix de gros compris) : un total truqué est ignoré ;
- l'acheteur ne peut que confirmer la réception ou signaler « pas reçu » ; le vendeur expédier, annuler ou rembourser ;
- avis possible uniquement sur une commande livrée, un seul par commande ;
- comptes d'encaissement visibles par leur seul propriétaire (4 derniers chiffres seulement) ;
- fermeture de boutique : suppression des comptes de paiement et arrêt de l'abonnement ;
- suppression de compte : l'historique des commandes est conservé mais anonymisé.

## Reste à brancher

1. **Paiement en ligne des commandes** : chaque vendeur relie son propre compte marchand (Orange Money, Wave, MTN, Moov, carte) chez un agrégateur (CinetPay, PayDunya, Flutterwave…). Aujourd'hui, une commande en ligne est créée en statut « en attente de paiement » ; il faut la redirection vers l'opérateur et un webhook qui passe la commande en `confirmed`. Le paiement à la livraison fonctionne déjà de bout en bout.
2. **Paiement des abonnements** à NEXORA : même agrégateur ; le webhook met `subscriptions.active = true`. Aujourd'hui l'abonnement s'active à l'autorisation de la boutique.
3. **E-mails de notification** (commande, expédition, avis…) : envoi via un service transactionnel en respectant `notification_preferences` (déjà enregistrées).
4. **Rappel des litiges** : tâche planifiée qui alerte l'admin quand `tickets.seller_deadline` (72 h) est dépassé.
5. **Photos produits** (Supabase Storage) et formulaire d'ajout de produits pour les vendeurs.

À faire avant la mise en ligne : vrai numéro WhatsApp et e-mails dans `lib/site.ts`, relecture juridique des pages légales.

Voir aussi `docs/DECISIONS.md`.

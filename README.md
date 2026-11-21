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
| `/tarifs` | 3 forfaits : Base 15 000, Pro 25 000, Ultra 50 000 FCFA/mois (annuel : 2 mois offerts) ; ce qui n'est pas encore construit est marqué « bientôt » |
| `/vendre` | Demande d'ouverture en 4 étapes (brouillon auto) |
| `/connexion` | Code par e-mail ou SMS, Google. Sans mot de passe |
| `/compte` | Commandes, « J'ai reçu » / « Pas reçu », SAV, notifications, export / suppression |
| `/vendeur` | Statut, comptes d'encaissement, fermeture de boutique |
| `/vendeur/produits` | Produits du vendeur : ajout, modification, photos, visite 360° (immobilier) |
| `/admin` | **Admin unique** : autoriser / refuser / suspendre les vendeurs, litiges |
| `/support` | WhatsApp, e-mail, formulaire vers l'admin, protection acheteur |
| `/securite`, `/confidentialite`, `/conditions` | Informations (textes légaux à faire relire) |

## Accueil et pages principales (motion design)

| Où | Quoi |
|---|---|
| `/` | Logo NEXORA en motion design : il se dessine, son cadre tourne, quatre points (les couleurs des pages) gravitent. Il tourne au doigt (glisser : élan conservé, puis retour droit avec un ressort ; toucher ou Entrée : un tour). En glissant vers le bas : les pages, chacune encadrée et animée dans sa couleur. |
| `/award` (or sur noir) | Le logo tourne sur lui-même en passant à l'or, une onde dorée s'ouvre sur le palmarès (boutiques du mois, du semestre, de l'année) et les 3 meilleures boutiques et produits de chaque catégorie (avis vérifiés, moyenne lissée). |
| `/categories` (violet) | 8 types de boutiques, chacun sa couleur et son animation : Vêtements, Technologie, Immobilier, Automobile, Meubles & déco, Beauté, Épicerie, Vente en gros. `/categories/[type]` : boutiques de A à Z avec index par lettre. |
| `/vendre` « Créer ma boutique » (vert) | 5 étapes avec aperçu en direct : nom, type, quelques prix ; pays, ville, quartier, boutique physique (lien Google Maps ou « Ma position actuelle ») ; WhatsApp et numéro d'appel ; encaissement ; forfait. |
| `/reglages` (bleu, connexion obligatoire) | Moyen de paiement préféré (présélectionné à chaque achat), panier (commande de tout le panier en une fois), historique d'achats. |
| « Ma boutique » / « Admin » | Tuiles en plus : la boutique pour un vendeur, l'administration pour le fondateur seulement. |

Animations : transform et opacité seulement, durées courtes, courbes ease-out ; toutes coupées en « mouvement réduit » ; sans JavaScript, tout reste visible. Plus de 3D décorative : Three.js ne sert qu'à la visite 360° (chargé à l'ouverture de la visite). Environ 114 Ko de JavaScript sur l'accueil mobile.

## Vidéos (HyperFrames)

Les vidéos animées sont fabriquées avec [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML → MP4, licence Apache 2.0), version figée `0.9.19`, statistiques d'usage désactivées. Il faut **Node 22, FFmpeg et Chrome/Chromium** sur la machine qui fabrique.

**Accueil et catégories** : `npm run videos:site` (ou `npm run videos:site -- accueil mode`) régénère `public/videos/*.mp4` et leurs couvertures. Les textes sont dans `videos/site-videos.ts`. Environ 250 Ko par vidéo de 12 s, 20 s de fabrication.

**Vidéo de chaque boutique** :
1. Dans `/vendeur`, le vendeur décrit son activité. Quota mensuel : Base 1, Pro 3, Ultra 10.
2. Le programme de fabrication `npm run videos:worker` (en continu, ou `-- --once`) prend la demande, rédige le scénario (avec Claude si `ANTHROPIC_API_KEY` est renseignée, sinon sans IA), rend la vidéo avec le modèle `videos/template/` et la dépose dans le stockage Supabase `shop-videos`.
3. L'admin la voit dans `/admin` → **Vidéos de boutique**, la publie ou la refuse. Rien n'est publié sans lui.
4. La vidéo publiée s'affiche sur la page de la boutique.

Le programme de fabrication tourne sur n'importe quelle machine (l'ordinateur de l'admin pendant la phase de test, un petit serveur ensuite) : il lit `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`.

Sécurité : les textes du vendeur sont insérés comme texte brut (jamais comme HTML ou code), les balises et liens sont retirés, la description est traitée comme une donnée par l'IA, les couleurs et icônes viennent de listes fermées. Lecture sur le site : rien n'est téléchargé avant que la vidéo soit visible, pas de lecture automatique en mode économie de données ou mouvement réduit.

## Produits, photos et visite 360°

- Dans `/vendeur/produits`, le vendeur ajoute ses produits et envoie **jusqu'à 12 photos** par produit. Les photos sont compressées sur son téléphone avant l'envoi (WebP, 1 600 px, souvent moins de 100 Ko) : peu de données mobiles consommées.
- **Immobilier** : prix au mois, à la nuit ou au jour, bouton « Demander une visite » (message transmis par NEXORA) et **visite 360°** : une photo panoramique par pièce (format 2:1, prise avec une caméra 360° ou une application « photo sphère »), nommée par le vendeur. L'acheteur tourne dans la pièce au doigt, zoome, passe d'une pièce à l'autre. La 3D n'est téléchargée qu'à l'ouverture de la visite.
- Les fichiers vont dans le stockage Supabase `product-media`, dans le dossier de la boutique : un vendeur ne peut écrire que dans le dossier de **sa** boutique autorisée, images seulement. Les modèles 3D (étape « aperçu IA » à venir) ne peuvent être déposés que par NEXORA.
- **Rotation 360° des objets** (toutes les catégories sauf l'immobilier) : le vendeur pose l'objet sur un fond uni et prend 24 à 36 photos en tournant autour. Il les envoie d'un coup ; elles sont rangées dans l'ordre de prise de vue (nom des fichiers, IMG_2 avant IMG_10). À partir de 8 photos, la fiche affiche « Rotation 360° » : l'acheteur fait tourner l'objet au doigt, au curseur ou aux flèches du clavier. Aucune 3D : on affiche la bonne photo, ce qui fonctionne sur tous les téléphones. Les photos ne sont téléchargées qu'à l'ouverture (24 photos ≈ 1 Mo). Bouton « Tout supprimer » pour refaire la série.
- **Modifications demandées par écrit** : sur la page d'un produit, le vendeur écrit ce qu'il veut changer (« baisse le prix à 15 000, ajoute que c'est fait main »). NEXORA prépare la modification (avec Claude si `ANTHROPIC_API_KEY` est renseignée ; sans clé, seul un nouveau prix est repris) et le vendeur voit l'avant → après. L'admin la retrouve dans `/admin` → **Modifications de fiche demandées**, corrige si besoin, puis applique ou refuse avec un message. Rien ne change sur la fiche sans lui. Champs concernés : nom, accroche, description, prix, prix barré, caractéristiques. Limites : 5 demandes en attente et 30 par mois par boutique. Le serveur a besoin de `SUPABASE_SERVICE_ROLE_KEY` pour enregistrer la proposition (sinon l'admin modifie à la main).
- Prévu ensuite : modèle 3D généré par IA marqué « aperçu IA » et validé par l'admin.

## Boutique animée (Pro) et Vitrine Ultra

Dans « Ma boutique » → **Apparence de la boutique** (aperçu en direct) :
- **Pro** : couleur de la marque (10 couleurs vives, lisibles sur fond noir) ; la page de la boutique s'ouvre sur un en-tête animé : monogramme qui se dessine, nom révélé lettre par lettre, halo qui dérive.
- **Ultra (Vitrine Ultra)** : en plus, en-tête presque plein écran, **animation signature** au choix (Vague, Constellation, Ruban, Pulsation) et **police** du nom (Élégante, Moderne, Technique).
- Sans choix de couleur, celle du type de boutique est utilisée. Les réglages peuvent être préparés à tout forfait et s'affichent dès que le forfait les inclut (migration 0014, listes fermées vérifiées par la base). Tout est fixe en « mouvement réduit ».

## « À la une » (Ultra)

Les boutiques Ultra en ligne sont mises en avant en haut de leur page de catégorie (jusqu'à 3) et dans la page Award (une par catégorie, section « À la une cette semaine », séparée du palmarès). L'ordre est tiré chaque lundi d'une empreinte boutique + semaine (fonction `featured_shops`, migration 0015) : rotation équitable, identique pour tous, sans choix manuel. Chaque carte est marquée « Mise en avant · Ultra ». Une boutique suspendue ou qui quitte Ultra disparaît aussitôt.

## Présentation animée des produits (Ultra)

Pour les boutiques au forfait Ultra, chaque produit qui a une photo reçoit sur sa fiche une **présentation animée en motion design** (4 scènes façon « stories » : photo et nom, caractéristiques, prix, mosaïque et « Commander »), construite à partir des vraies photos et des informations du vendeur. Aucune IA, aucune 3D, rien à valider ni à payer par produit. Lecture seulement quand elle est visible ; toucher à gauche/droite, flèches du clavier, pause ; fixe en « mouvement réduit ». Le forfait public d'une boutique est lu par la fonction `shop_tier` (migration 0013), qui ne révèle rien d'autre de l'abonnement.

## Essayage virtuel des vêtements

Sur un vêtement qui a une photo : « Essayer sur ma photo ». Le client choisit un ensemble (1 à 3 pièces de la boutique, encadrées dans sa couleur), accepte que sa photo serve à cet essai, touche « Tester », choisit une photo dans sa galerie : le rendu est généré automatiquement (avant/après, ensemble ajouté au panier en un geste).

- Essais par client et par boutique : **Base 5, Pro 15, Ultra illimité** ; un essai raté est rendu (migration 0012).
- La photo est compressée sur le téléphone, transmise au service d'IA pour cet essai, **jamais conservée** par NEXORA.
- Service d'IA à brancher : `TRYON_PROVIDER=http`, `TRYON_ENDPOINT`, `TRYON_API_KEY` (format décrit dans `lib/tryon.ts`). Sans réglage, l'essayage est annoncé « bientôt » et aucun essai n'est décompté. `TRYON_PROVIDER=mock` : tests uniquement (superposition, sans IA).

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
- `supabase/tests/` : 48 scénarios d'attaque à rejouer sur la base (voir son README).

## Mettre en ligne avec Supabase

1. **Créer le projet** sur supabase.com (région la plus proche de vos clients).
2. **Créer les tables** : exécuter dans l'éditeur SQL, dans l'ordre, `supabase/migrations/0001_init.sql`, `0002_app.sql`, `0003_subscription_payments.sql`, `0004_rewards.sql` puis `0005_shop_videos.sql`. Ne **pas** exécuter `seed.sql` (données de démonstration).
3. **Variables** sur l'hébergeur : `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secrète, jamais côté navigateur), et pour les abonnements : `NEXT_PUBLIC_ADMIN_WHATSAPP`, `NEXT_PUBLIC_ADMIN_PHONE`, `NEXT_PUBLIC_ADMIN_PHONE_DISPLAY`, `ADMIN_ORANGE_MONEY_NUMBER`, `ADMIN_ORANGE_MONEY_NAME`.
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

### Paiement des abonnements (Mobile Money, contact obligatoire)

1. L'admin autorise la boutique. Elle reste **invisible** tant que l'abonnement n'est pas payé.
2. Le vendeur choisit son forfait dans `/vendeur` : le site lui demande de **contacter l'admin** (WhatsApp prérempli avec la référence, ou appel). Aucune coordonnée de paiement n'est affichée.
3. Après l'échange, l'admin clique « Vendeur contacté » dans `/admin`. Le serveur envoie alors au vendeur le numéro Orange Money (`ADMIN_ORANGE_MONEY_NUMBER`, jamais présent dans le code du navigateur).
4. Le vendeur paie et saisit le numéro de transaction reçu par SMS.
5. L'admin vérifie le SMS sur son téléphone et clique « Paiement reçu » : boutique visible pour 1 mois (ou 1 an). À l'échéance, elle est masquée jusqu'au paiement suivant.

Sans l'étape 3, la base refuse toute déclaration de paiement. Montants calculés par la base, un numéro de transaction ne sert qu'une fois, une seule demande en cours par boutique.

Opérateurs : Orange Money toujours proposé ; Wave, MTN MoMo et Moov Money dès que leur numéro est renseigné côté serveur (`ADMIN_WAVE_NUMBER`, `ADMIN_MTN_MOMO_NUMBER`, `ADMIN_MOOV_MONEY_NUMBER`, et `…_NAME`). L'opérateur est figé au moment de la demande.

### Récompenses et mois offerts (admin seul)

- Dans `/admin`, section **Récompenses** : classement du **mois**, du **semestre** et de l'**année**, calculé sur les ventes livrées. La note moyenne et le nombre de litiges sont affichés pour aider à choisir.
- L'admin désigne le gagnant (un seul par période) et offre de 0 à 12 mois gratuits, **à partir d'un mois précis** (ex. janvier 2027) ou **à la suite** de l'abonnement en cours. Il peut aussi offrir des mois hors classement (geste commercial) et retirer une récompense.
- Les mois offerts comptent comme un abonnement payé : la boutique reste en ligne sans payer pendant cette période. Un paiement confirmé prolonge à partir de la fin de couverture (payée + offerte).
- Badge public « Meilleur vendeur de… » sur la page de la boutique (les cadeaux libres restent privés).
- Chaque vendeur a son **tableau de bord** dans `/vendeur` (ventes livrées, chiffre d'affaires, commandes à traiter, note, rang du mois, récompenses). Il n'est accessible qu'au vendeur : l'admin n'y a pas accès et ne peut rien y modifier.

### Ce que garantit la base (testé)

- un seul compte `admin` ; personne ne peut changer son propre rôle ;
- seul l'admin autorise, refuse ou suspend une boutique (journalisé dans `admin_audit`) ; le vendeur peut seulement fermer la sienne ;
- une boutique non autorisée n'apparaît nulle part et ne peut pas publier de produits ;
- le total d'une commande est recalculé par la base (prix de gros compris) : un total truqué est ignoré ;
- l'acheteur ne peut que confirmer la réception ou signaler « pas reçu » ; le vendeur expédier, annuler ou rembourser ;
- avis possible uniquement sur une commande livrée, un seul par commande ;
- comptes d'encaissement visibles par leur seul propriétaire (4 derniers chiffres seulement) ;
- une boutique n'est visible que si elle est autorisée **et** couverte (abonnement payé en cours ou mois offerts) ;
- seul l'admin peut offrir ou retirer des mois et consulter le classement complet ; un vendeur ne voit que ses propres chiffres ;
- fermeture de boutique : suppression des comptes de paiement et arrêt de l'abonnement ;
- suppression de compte : l'historique des commandes est conservé mais anonymisé ;
- coordonnées des responsables (nom, e-mail, téléphone) illisibles par l'API publique, réservées à l'admin (migration 0009 ; avant, elles étaient lisibles par tous) ;
- fiche publique : liens Google Maps uniquement, numéros et prix vérifiés par la base ;
- essayage : quotas par forfait appliqués par la base, aucune écriture directe possible ;
- photos et panoramas : dépôt uniquement dans le dossier de sa boutique autorisée, quotas par produit, jamais de modèle 3D ni de marque « IA » posés par un vendeur (58 scénarios d'attaque dans `supabase/tests/media_test.sql`) ;
- modifications par écrit : le vendeur demande et annule, jamais il n'écrit la proposition ni ne l'applique ; seul l'admin applique, champ par champ (14 scénarios dans `supabase/tests/edits_test.sql`).

## Reste à brancher

1. **Paiement en ligne des commandes** : chaque vendeur relie son propre compte marchand (Orange Money, Wave, MTN, Moov, carte) chez un agrégateur (CinetPay, PayDunya, Flutterwave…). Aujourd'hui, une commande en ligne est créée en statut « en attente de paiement » ; il faut la redirection vers l'opérateur et un webhook qui passe la commande en `confirmed`. Le paiement à la livraison fonctionne déjà de bout en bout.
2. **Paiement automatique des abonnements** (facultatif) : aujourd'hui le paiement se fait par Orange Money avec confirmation manuelle de l'admin (voir plus haut). Un agrégateur (PayDunya, Moneroo…) ou Orange Money Business pourra l'automatiser ensuite.
3. **E-mails de notification** (commande, expédition, avis…) : envoi via un service transactionnel en respectant `notification_preferences` (déjà enregistrées).
4. **Rappel des litiges** : tâche planifiée qui alerte l'admin quand `tickets.seller_deadline` (72 h) est dépassé.

À faire avant la mise en ligne : vrai numéro WhatsApp et e-mails dans `lib/site.ts`, relecture juridique des pages légales.

Voir aussi `docs/DECISIONS.md`.

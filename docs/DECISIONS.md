# Décisions du projet NEXORA

À relire au début de chaque nouvelle session : c'est la mémoire du projet.

## Demandes du propriétaire (novembre 2026)
- Design inspiré de la référence fournie (noir, bordures #292d30, accent violet #9281f7, serif en titre, mono pour les données) et de Shopify / Alibaba **sans copie** : nom, logo, textes et structure propres.
- Corriger les défauts des grandes plateformes ; ne pas les nommer sur le site (risque juridique de publicité comparative).
- SEO soigné.
- 3 forfaits payants, **pas de gratuit** : Essentiel 4 900, Pro 12 900, Business 29 900 FCFA/mois ; annuel = 10 mois payés.
- SAV facile à joindre : bouton permanent, WhatsApp, e-mail, formulaire direct vers l'admin.
- Avis clients, uniquement sur achat livré.
- Paiements africains : Orange Money, Wave, MTN MoMo, Moov, carte, + paiement à la livraison.
- Les vendeurs sont autorisés / désautorisés par **un seul admin** (le propriétaire).
- Sécurité contre le piratage des données.
- Connexion facile (code e-mail/SMS, Google, sans mot de passe).
- Fermeture de boutique = possibilité de supprimer cartes et comptes associés.
- Pas de questions répétées : profil réutilisé, brouillon auto du formulaire vendeur, ticket SAV pré-rempli.
- Le vendeur reçoit l'argent directement, pas l'admin.
- Produit non reçu : litige → 72 h pour le vendeur → arbitrage admin (remboursement exigé / suspension).
- E-mails peu nombreux et désactivables.

## Choix techniques
- Next.js 15 (App Router, pages pré-rendues pour le SEO), TypeScript 5, Tailwind 4, polices auto-hébergées (@fontsource).
- Devise : FCFA (XOF). Langue : français.
- Supabase branché (migrations, RLS, Server Actions, connexion par code). Sans variables Supabase, le site retombe en mode démo (`localStorage`).
- Commande en ligne : connexion obligatoire (un code suffit). Question simple au SAV : possible sans compte. Litiges : compte obligatoire.
- Sécurité vérifiée dans la base elle-même (triggers + RLS), pas seulement dans le site : 14 scénarios d'attaque dans `supabase/tests`.
- Comme l'argent va au vendeur, NEXORA ne peut pas rembourser elle-même : elle impose le délai et sanctionne. C'est expliqué au client, qui peut choisir le paiement à la livraison.

## Paiement des abonnements (novembre 2026)
- Par Orange Money, vers le compte de l'admin. Décision du propriétaire : **le vendeur doit obligatoirement contacter l'admin (WhatsApp ou appel) avant tout paiement** ; sans ce contact, ça ne marche pas.
- Appliqué par la base (table subscription_payments, étapes verrouillées) et non par le seul affichage.
- Le numéro Orange Money de l'admin est une variable serveur, envoyée au vendeur uniquement après le contact.
- Une boutique n'est visible que si elle est autorisée ET que l'abonnement est payé et non expiré.
- Agrégateurs étudiés : CinetPay (retraits vers Orange Mali pas encore ouverts), PayDunya (2e choix), Orange Money Business en direct (1er choix, réponse d'Orange Mali attendue).

## Récompenses (novembre 2026)
- Meilleur vendeur du mois, du semestre et de l'année : classement par ventes LIVRÉES (pas les commandes annulées ou en litige) ; note et litiges affichés à titre d'aide.
- L'admin seul désigne le gagnant et offre des mois gratuits (mois précis ou à la suite de l'abonnement) ; il peut aussi offrir des mois hors classement et retirer une récompense. Fonctions SQL réservées à is_admin(), aucune écriture directe possible.
- Mois offerts = couverture d'abonnement (shop_covered_until) ; boutique en ligne si autorisée ET couverte.
- Mini tableau de bord par boutique dans /vendeur, propre au vendeur ; l'admin ne le pilote pas (il garde seulement l'arbitrage des litiges et l'autorisation/suspension).
- La demande mentionnait aussi « meilleur de la semaine » : non retenu (mois, semestre, année), à confirmer avec le propriétaire.

## Vidéos HyperFrames (novembre 2026)
- Accueil + chaque catégorie : vidéos de 12 s rendues avec HyperFrames (fichiers statiques dans public/videos). Textes provisoires :
  le propriétaire enverra des descriptions plus détaillées pour chaque partie (immobilier, mobilier, conception…).
- Vidéo de boutique « à partir de la description » : IA (Claude, sorties structurées) + modèles ; repli sans IA si pas de clé.
- Le propriétaire valide chaque vidéo avant publication ; quotas mensuels par forfait (1 / 3 / 10).
- Pas d'hébergement pour l'instant : phase de test privée de quelques mois avec des boutiques de son entourage, site non publié.
  Le programme de fabrication tourne sur n'importe quelle machine ; un petit serveur plus tard.
- La catégorie « immobilier » existe désormais dans le catalogue, avec sa vidéo.

## Produits, photos et visite 360° (novembre 2026)
- Feuille de route choisie : 1) produits + photos, 2) visite 360° immobilier, 3) rotation 360° d'objets à partir de vraies photos,
  4) modifications par texte du vendeur (validées par l'admin), 5) modèle 3D généré par IA, marqué « aperçu IA » et validé par l'admin.
  Étapes 1 et 2 livrées (migration 0006).
- Visite 360° : vraies photos panoramiques par pièce (pas de reconstruction IA), affichées dans une sphère Three.js chargée à la demande.
- Compression des images sur l'appareil du vendeur avant l'envoi (WebP) : connexions lentes et forfaits mobiles.
- Envoi direct du navigateur vers le stockage, protégé par les règles de stockage (dossier = identifiant de la boutique autorisée).
- Sur mobile, la fiche produit montre la photo, puis le prix et le bouton, puis la description.
- Étape 3 livrée : rotation 360° par série de vraies photos (pas de 3D ni d'IA), affichée à partir de 8 vues,
  ordre de prise de vue respecté à l'envoi. Migration 0007 : le vendeur peut lire les fichiers de sa boutique
  dans le stockage, sans quoi la suppression ne supprimait rien (les fichiers restaient en ligne).
- Étape 4 livrée (migration 0008) : demandes de modification écrites. L'IA ne fait que proposer ; la proposition est
  écrite avec la clé serveur (le vendeur ne peut pas la fabriquer), bornée et filtrée (seuls les champs qui changent),
  affichée comme texte ; l'admin a le dernier mot et peut corriger chaque champ. La demande du vendeur est passée
  à l'IA comme une donnée entre balises, jamais comme une consigne. Sans clé ou en cas de panne : version sans IA.
- Le vendeur garde aussi le formulaire de modification directe de sa fiche.

## Animations et 3D (skill animations-3d-nexora)
- Couleurs : on garde noir + violet (choix du propriétaire), pas la charte bleu/orange du skill.
- Écran d'ouverture 1,3 s, une fois par session, piloté par un script intégré (lib/motion-script.ts) et non par React,
  pour finir à l'heure même sur téléphone lent. Jamais sur /admin, /vendeur, /compte, /connexion, ni en mouvement réduit.
- Apparition des cartes au défilement en CSS + IntersectionObserver ([data-reveal]) : sans JavaScript, rien n'est caché.
- 3D (Three.js, sans React Three Fiber) uniquement sur la bannière d'accueil, chargée en différé, seulement sur
  ordinateur capable (≥ 1024 px, ≥ 4 Go, ≥ 4 cœurs, pas d'économie de données, vraie carte graphique). Sinon : logo SVG.
- Novembre 2026 : le cube est remplacé par le logo NEXORA en verre, d'après le skill « Premium 3D Glass » fourni par le
  propriétaire (verre, studio, extrusion biseautée). Seuls ces réglages sont repris, pas le site vitrine du skill ni sa
  copie de Three.js r160 ; dispersion native de Three.js r187. Surveillance des images/s avec retour au SVG si lent.
- Pas de GSAP ni de Framer Motion : aucun besoin qui le justifie, 0 Ko ajouté.

## Refonte motion design (21 novembre 2026)
- Le propriétaire trouve la 3D décorative dépassée : logo verre 3D et écran d'ouverture retirés, remplacés par un logo
  en motion design (SVG + CSS, geste au doigt en JS avec ressort). Three.js reste pour la visite 360°.
- Skills utilisés : web-animation-design, emil-design-engineering, make-interfaces-feel-better, audit-as-a11y-eng (audit-suite),
  frontend-design (Anthropic), vercel-react-view-transitions et web-design-guidelines (Vercel), installés dans le projet.
- Accueil = logo + tuiles Award (or), Catégories (violet), Créer ma boutique (vert), Réglages (bleu) ; « Ma boutique »
  et « Admin » selon le compte. La couleur d'une tuile est celle de sa page.
- Award : transition logo → or (0,9 s, directe en mouvement réduit) ; classement par moyenne lissée des avis vérifiés.
- Catégories : slugs inchangés (mode, electronique, maison…) pour ne casser aucune adresse ; libellés renommés
  (Vêtements, Technologie, Meubles & déco) ; Automobile ajoutée (avec sa vidéo HyperFrames).
- Créer ma boutique : inspiré des meilleures pratiques e-commerce (étapes courtes, aperçu en direct), sans copie.
  Google Maps sans clé : lien collé ou position du téléphone, carte chargée seulement à la demande (vie privée, données).
- Faille corrigée (migration 0009) : nom, e-mail et téléphone des responsables étaient lisibles via l'API publique.
- Forfaits : Base 15 000, Pro 25 000, Ultra 50 000 FCFA (identifiants internes inchangés). Fonctions non construites
  marquées « bientôt ». Abonnement payable par 4 opérateurs Mobile Money, contact de l'admin toujours obligatoire.
- Réglages : panier sur l'appareil (localStorage), une commande par article ; paiement préféré sur le profil.
- Essayage : 5 essais par client (Base), 15 (Pro), illimité (Ultra) ; photo jamais conservée ; fournisseur d'IA
  branché par adaptateur HTTP, à choisir par le propriétaire (clé payante).
- Étape 5 (« aperçu 3D par IA ») remplacée, à la demande du propriétaire, par une présentation animée en motion design
  des produits (Ultra), faite à partir des photos du vendeur : pas d'IA, pas de 3D, pas de validation ni de coût par produit.
  La colonne model3d de la migration 0006 reste en réserve, inutilisée.
- « Boutique animée » (Pro) et « Vitrine Ultra » faites en motion design (SVG + CSS) : couleurs, animations et polices
  dans des listes fermées plutôt qu'un thème « créé sur mesure » (texte du forfait ajusté en conséquence) : rendu
  toujours lisible, léger et sûr. Le nom de la boutique reste un vrai titre h1 pour Google et les lecteurs d'écran.
- Audit d'accessibilité (reviews/audit-as-a11y-eng.md) : focus des fenêtres plein écran, rôle du logo, contraste du gris
  secondaire (#7c8088, 5,3:1) corrigés.

## Historique
- Novembre 2026 : branchement Supabase testé de bout en bout sur un Supabase local (20 vérifications navigateur + 14 attaques SQL).
- Un premier essai (branche `claude/nexora-marketplace-design-bx4zii`, 3 commits) n'a jamais pu être récupéré : le projet a été refait de zéro sur `claude/nexora-marketplace-design-74sqrs`.

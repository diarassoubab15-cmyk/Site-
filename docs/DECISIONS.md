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

## Animations et 3D (skill animations-3d-nexora)
- Couleurs : on garde noir + violet (choix du propriétaire), pas la charte bleu/orange du skill.
- Écran d'ouverture 1,3 s, une fois par session, piloté par un script intégré (lib/motion-script.ts) et non par React,
  pour finir à l'heure même sur téléphone lent. Jamais sur /admin, /vendeur, /compte, /connexion, ni en mouvement réduit.
- Apparition des cartes au défilement en CSS + IntersectionObserver ([data-reveal]) : sans JavaScript, rien n'est caché.
- 3D (Three.js, sans React Three Fiber) uniquement sur la bannière d'accueil, chargée en différé, seulement sur
  ordinateur capable (≥ 1024 px, ≥ 4 Go, ≥ 4 cœurs, pas d'économie de données). Sinon : cube CSS.
- Pas de GSAP ni de Framer Motion : aucun besoin qui le justifie, 0 Ko ajouté.

## Historique
- Novembre 2026 : branchement Supabase testé de bout en bout sur un Supabase local (20 vérifications navigateur + 14 attaques SQL).
- Un premier essai (branche `claude/nexora-marketplace-design-bx4zii`, 3 commits) n'a jamais pu être récupéré : le projet a été refait de zéro sur `claude/nexora-marketplace-design-74sqrs`.

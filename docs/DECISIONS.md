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
- Supabase prévu (schéma dans `supabase/migrations`). En attendant, mode démo via `localStorage`.
- Comme l'argent va au vendeur, NEXORA ne peut pas rembourser elle-même : elle impose le délai et sanctionne. C'est expliqué au client, qui peut choisir le paiement à la livraison.

## Historique
- Un premier essai (branche `claude/nexora-marketplace-design-bx4zii`, 3 commits) n'a jamais pu être récupéré : le projet a été refait de zéro sur `claude/nexora-marketplace-design-74sqrs`.

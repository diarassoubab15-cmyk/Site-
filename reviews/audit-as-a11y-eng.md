# Accessibility Audit: refonte NEXORA (accueil motion design, Award, Catégories, Créer ma boutique, Réglages, essayage)

**Perspective**: Accessibility Engineer
**Date**: 2026-11-21
**Plan**: mode « repo » — composants SpinLogo, HubTiles, TryOn, SettingsPanels, SellerApplyForm, ShopMap ; pages /award, /categories, /reglages

## Plan Summary
Nouvelle navigation par tuiles animées, logo interactif au toucher, fenêtre plein écran d'essayage virtuel, panier et réglages. Risques : élément interactif non standard (logo), fenêtres modales (focus), contrastes des textes secondaires, animations.

## Files Reviewed
| File | A11y Role | Risk |
|------|----------|------|
| components/SpinLogo.tsx | Élément interactif personnalisé (toucher, clavier) | Élevé |
| components/HubTiles.tsx | Liens de navigation + transition animée | Moyen |
| components/TryOn.tsx | Fenêtre modale, sélection, envoi de photo, résultat dynamique | Élevé |
| components/SettingsPanels.tsx | Groupe de boutons radio, panier (+/−, retirer), formulaire | Moyen |
| components/SellerApplyForm.tsx | Formulaire en étapes, erreurs | Moyen |
| components/ShopMap.tsx | Bouton dépliant + iframe | Faible |
| app/award, app/categories, app/reglages | Pages statiques, titres, listes | Faible |

## Verdict: APPROVE WITH CHANGES → changements appliqués

## Critical Issues (Must Fix)
| # | Issue | WCAG Criterion | File(s) | Impact | Fix |
|---|-------|---------------|---------|--------|-----|
| 1 | Fenêtres plein écran : le focus restait sur la page derrière, Tab y retournait, et ne revenait pas au bouton à la fermeture | 2.4.3 Ordre du focus, 2.1.2 | TryOn, PanoTour, SpinViewer | Clavier / lecteur d'écran perdus derrière la fenêtre | `lib/use-dialog.ts` : focus initial dans la fenêtre, reste de la page `inert`, retour du focus au déclencheur — **corrigé et vérifié** (Tab ×15 ne sort jamais vers la page) |
| 2 | Logo interactif déclaré `role="img"` avec `tabIndex=0` | 4.1.2 Nom, rôle, valeur | SpinLogo | Annoncé comme une image : l'action est invisible | `role="button"`, libellé d'action, Entrée/Espace font tourner — **corrigé et vérifié** |
| 3 | Texte secondaire gris (#6e727a) à 4,35:1 sur noir | 1.4.3 Contraste | globals.css (`--color-iron`) | Mentions et aides peu lisibles | #7c8088 = 5,3:1 — **corrigé** (toutes les pages en profitent) |

## Recommendations
| # | Issue | WCAG Criterion | Fix |
|---|-------|---------------|-----|
| 1 | Résultat d'essayage affiché sans annonce | 4.1.3 Messages d'état | Message `role="status"` « Rendu de l'essayage prêt » — **appliqué** |
| 2 | Médailles 1/2/3 : `aria-label` sur un `span` sans rôle (ignoré) | 1.1.1 | Texte masqué visuellement « 1er / 2e / 3e » — **appliqué** |
| 3 | Boutons « Retirer » du panier identiques | 2.4.6 | `aria-label="Retirer {produit} du panier"` — **appliqué** |
| 4 | « Maintenir pour voir l'avant » repose sur un appui long | 2.5.1 | Fonctionne aussi à l'Espace ; un bouton bascule « Avant / Après » serait plus simple — à faire |

## Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Annoncer l'étape courante du formulaire « Créer ma boutique » (« Étape 2 sur 5 ») | `aria-current="step"` existe ; une annonce vocale aiderait |
| 2 | Bouton « Passer l'animation » sur la transition Award | Elle dure 0,9 s et est déjà supprimée en mouvement réduit |

## Keyboard Navigation Walkthrough
| Step | Action | Expected Focus | Expected Announcement | Plan Handles? |
|------|--------|---------------|----------------------|---------------|
| 1 | Tab jusqu'au logo, Entrée | Logo | « Logo NEXORA : touchez-le pour le faire tourner, bouton » | Oui (vérifié) |
| 2 | Tab vers les tuiles | Award, Catégories, Créer ma boutique, Réglages | Titre + description de chaque lien | Oui |
| 3 | Fiche vêtement : « Essayer sur ma photo », Entrée | Bouton « Fermer » de la fenêtre | « Essayage virtuel, boîte de dialogue » | Oui (vérifié) |
| 4 | Tab dans la fenêtre | Vêtements (boutons à bascule, `aria-pressed`), consentement, « Tester » | État choisi / non choisi | Oui |
| 5 | Échap | Bouton « Essayer sur ma photo » | — | Oui (vérifié) |
| 6 | Réglages : flèches dans le groupe de paiement | Boutons radio | « Wave, bouton radio, coché » | Oui (radios natifs) |

## ARIA Checklist
| Element | Role | Label | States | Keyboard | Notes |
|---------|------|-------|--------|----------|-------|
| Logo | button | « Logo NEXORA : touchez-le pour le faire tourner » | — | Entrée, Espace | Défilement vertical libre (pan-y) |
| Fenêtre d'essayage | dialog (aria-modal) | « Essayage virtuel » | — | Échap, Tab confiné | Page derrière `inert` |
| Vêtement de l'ensemble | button | Nom + prix | aria-pressed | Entrée, Espace | Cadre couleur + coche (pas la couleur seule) |
| Paiement préféré | radio (natif) | Nom de l'opérateur | checked | Flèches | |
| Carte Google Maps | button | « Voir sur la carte » | aria-expanded | Entrée | iframe avec titre |

## Verdict Details
- Screen Reader Compatibility: PASS (après corrections)
- Keyboard Navigation: PASS
- Focus Management: PASS (après corrections)
- Color Contrast: PASS (après corrections)
- Motion Sensitivity: PASS — logo, tuiles, icônes, rideau Award et balayage de l'essayage coupés en mouvement réduit (vérifié automatiquement)

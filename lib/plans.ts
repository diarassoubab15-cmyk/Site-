export type PlanId = "decouverte" | "essentiel" | "pro" | "business";
/** Forfaits payants : seuls ceux-ci se paient (Orange Money, Wave…). */
export type PaidPlanId = Exclude<PlanId, "decouverte">;

export type PlanFeature ={ text: string; /** pas encore disponible : affiché « bientôt », jamais promis comme acquis */ soon?: boolean };

export type Plan = {
  /** Identifiant interne (inchangé pour les abonnements en cours) : decouverte = gratuit, essentiel = Base, business = Ultra. */
  id: PlanId;
  name: string;
  pitch: string;
  monthly: number; // FCFA / mois, facturation mensuelle (le même tarif est appliqué par la base)
  products: string;
  features: PlanFeature[];
  highlighted?: boolean;
  /** Couleur d'accent de la carte du forfait */
  color: string;
};

/** Remise appliquée en facturation annuelle (2 mois offerts). */
export const ANNUAL_MONTHS_PAID = 10;

export const plans: Plan[] = [
  {
    id: "essentiel",
    name: "Base",
    pitch: "Tout pour ouvrir sa boutique et vendre, essayage virtuel compris.",
    monthly: 15000,
    products: "Jusqu'à 100 produits",
    color: "#12995a",
    features: [
      { text: "Boutique en ligne avec adresse, carte, boutons WhatsApp et Appeler" },
      { text: "12 photos par produit, visite 360° (immobilier), rotation 360° des objets" },
      { text: "Essayage virtuel : vos clients essaient vos vêtements sur leur photo (5 essais par client)" },
      { text: "Paiement Orange Money, Wave, MTN, Moov, carte ou à la livraison" },
      { text: "0 % de commission : l'argent va directement chez vous" },
      { text: "Avis clients vérifiés, modifications de fiche par simple message" },
      { text: "1 vidéo animée de votre boutique par mois" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    pitch: "Une boutique animée qui se démarque, et plus d'outils pour vendre.",
    monthly: 25000,
    products: "Jusqu'à 1 000 produits",
    highlighted: true,
    color: "#5433eb",
    features: [
      { text: "Tout le forfait Base" },
      { text: "Boutique animée en motion design, aux couleurs de votre marque" },
      { text: "3 vidéos animées par mois" },
      { text: "Statistiques de ventes et classement de votre boutique" },
      { text: "15 essais virtuels par client" },
      { text: "Codes promo et ventes flash", soon: true },
      { text: "Badge Pro et SAV prioritaire (réponse en moins d'1 h)" },
    ],
  },
  {
    id: "business",
    name: "Ultra",
    pitch: "L'expérience premium : une boutique unique, vue en premier.",
    monthly: 50000,
    products: "Produits illimités",
    color: "#b7791f",
    features: [
      { text: "Tout le forfait Pro" },
      { text: "Vitrine Ultra : en-tête plein écran, animation signature (4 styles) et police au choix" },
      { text: "À la une de votre catégorie et de la page Award, en rotation chaque semaine" },
      { text: "Studio IA : décrivez une image ou une vidéo, l'IA la crée pour votre boutique (30 images et 4 vidéos par mois, rendu photo réaliste)" },
      { text: "Présentation animée en motion design de chaque produit, créée à partir de vos photos" },
      { text: "10 vidéos animées par mois" },
      { text: "Essais virtuels illimités pour vos clients" },
      { text: "Prix de gros par quantité et vente dans plusieurs pays" },
      { text: "Conseiller dédié joignable par téléphone" },
    ],
  },
];

/** Formule gratuite : pour démarrer sans rien payer (même limite que la base : 10 produits en ligne). */
export const freePlan: Plan = {
  id: "decouverte",
  name: "Découverte",
  pitch: "Gratuit pour toujours : ouvrez votre boutique et faites vos premières ventes.",
  monthly: 0,
  products: "Jusqu'à 10 produits",
  color: "#0e7490",
  features: [
    { text: "Boutique en ligne avec lien à partager et QR code" },
    { text: "Boutons WhatsApp et Appeler, paiement Orange Money, Wave ou à la livraison" },
    { text: "0 % de commission" },
    { text: "Avis clients vérifiés et commentaires" },
    { text: "Passez à Base, Pro ou Ultra quand vous voulez" },
  ],
};

/** Tous les forfaits, gratuit compris (affichage, choix à la création). `plans` = forfaits payants seulement. */
export const allPlans: Plan[] = [freePlan, ...plans];

export const planName = (id: string) => allPlans.find((p) => p.id === id)?.name ?? id;

/** Essais virtuels par client et par boutique, selon le forfait de la boutique (Ultra : illimité). */
export const TRYON_QUOTA: Record<Plan["id"], number> = { decouverte: 5, essentiel: 5, pro: 15, business: Number.POSITIVE_INFINITY };

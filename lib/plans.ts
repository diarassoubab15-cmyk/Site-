export type PlanFeature = { text: string; /** pas encore disponible : affiché « bientôt », jamais promis comme acquis */ soon?: boolean };

export type Plan = {
  /** Identifiant interne (inchangé pour les abonnements en cours) : essentiel = Base, business = Ultra. */
  id: "essentiel" | "pro" | "business";
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
    color: "#3ad389",
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
    color: "#9281f7",
    features: [
      { text: "Tout le forfait Base" },
      { text: "Boutique animée en motion design, aux couleurs de votre marque", soon: true },
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
    color: "#e3b341",
    features: [
      { text: "Tout le forfait Pro" },
      { text: "Vitrine Ultra : thème et animation signature créés pour votre boutique", soon: true },
      { text: "À la une de votre catégorie et dans la page Award, chaque semaine", soon: true },
      { text: "Présentation animée en motion design de chaque produit, créée à partir de vos photos" },
      { text: "10 vidéos animées par mois" },
      { text: "Essais virtuels illimités pour vos clients" },
      { text: "Prix de gros par quantité et vente dans plusieurs pays" },
      { text: "Conseiller dédié joignable par téléphone" },
    ],
  },
];

export const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id;

/** Essais virtuels par client et par boutique, selon le forfait de la boutique (Ultra : illimité). */
export const TRYON_QUOTA: Record<Plan["id"], number> = { essentiel: 5, pro: 15, business: Number.POSITIVE_INFINITY };

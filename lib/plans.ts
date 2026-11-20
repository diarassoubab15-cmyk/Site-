export type Plan = {
  id: "essentiel" | "pro" | "business";
  name: string;
  pitch: string;
  monthly: number; // FCFA / mois, facturation mensuelle
  products: string;
  features: string[];
  highlighted?: boolean;
};

/** Remise appliquée en facturation annuelle (2 mois offerts). */
export const ANNUAL_MONTHS_PAID = 10;

export const plans: Plan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    pitch: "Pour lancer sa boutique et vendre ses premiers produits.",
    monthly: 4900,
    products: "Jusqu'à 50 produits",
    features: [
      "Boutique en ligne avec votre propre adresse nexora/boutiques/…",
      "Paiements Orange Money, Wave, MTN, Moov et carte",
      "Paiement à la livraison activable",
      "0 % de commission sur vos ventes",
      "Avis clients vérifiés",
      "SAV par e-mail et WhatsApp",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    pitch: "Pour les vendeurs réguliers qui veulent grandir.",
    monthly: 12900,
    products: "Jusqu'à 1 000 produits",
    highlighted: true,
    features: [
      "Tout le forfait Essentiel",
      "Codes promo et ventes flash",
      "Statistiques de visites et de ventes",
      "Référencement Google avancé par produit",
      "3 comptes d'équipe",
      "SAV prioritaire (réponse en moins d'1 h)",
    ],
  },
  {
    id: "business",
    name: "Business",
    pitch: "Pour les grossistes, marques et vendeurs multi-pays.",
    monthly: 29900,
    products: "Produits illimités",
    features: [
      "Tout le forfait Pro",
      "Prix de gros par quantité",
      "Vente dans plusieurs pays et devises",
      "Comptes d'équipe illimités",
      "Export comptable",
      "Conseiller dédié joignable par téléphone",
    ],
  },
];

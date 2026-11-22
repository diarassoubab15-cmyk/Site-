/**
 * Les pages principales de NEXORA, chacune avec sa couleur : la même sur sa tuile d'accueil et dans son interface.
 * (Award : or sur noir ; Catégories : violet de la marque ; Créer : vert ; Réglages : bleu.)
 */
export type HubPage = {
  id: "award" | "categories" | "creer" | "reglages" | "boutique" | "admin";
  href: string;
  title: string;
  text: string;
  color: string;
  /** Teinte des textes sur la tuile (foncée sur blanc ; Award reste or sur noir). */
  light: string;
};

export const HUB_PAGES: HubPage[] = [
  { id: "award", href: "/award", title: "Award", text: "Les meilleures boutiques et les meilleurs produits du mois, du semestre et de l'année.", color: "#e3b341", light: "#f6d77a" },
  { id: "categories", href: "/categories", title: "Catégories", text: "Vêtements, technologie, immobilier, automobile… chaque univers et ses boutiques, de A à Z.", color: "#5433eb", light: "#5433eb" },
  { id: "creer", href: "/vendre", title: "Créer ma boutique", text: "Nom, prix, adresse, WhatsApp : votre boutique en ligne, vérifiée par NEXORA.", color: "#3ad389", light: "#12995a" },
  { id: "reglages", href: "/reglages", title: "Réglages", text: "Moyen de paiement préféré, panier et historique de vos achats.", color: "#3b9eff", light: "#1f6fd1" },
];

/** Pages en plus, selon le compte : le vendeur gère sa boutique, le fondateur administre le site. */
export const HUB_EXTRA: Record<"boutique" | "admin", HubPage> = {
  boutique: { id: "boutique", href: "/vendeur", title: "Ma boutique", text: "Vos ventes, vos produits, votre abonnement : le tableau de bord de votre boutique.", color: "#ff7a59", light: "#c2462a" },
  admin: { id: "admin", href: "/admin", title: "Admin", text: "Vendeurs à valider, paiements, récompenses, litiges. Réservé au fondateur.", color: "#3a3d44", light: "#0b0b0f" },
};

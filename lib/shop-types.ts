/**
 * Les types de boutiques : chacun a sa couleur (cadre, titres, ambiance de sa page) et sa propre animation.
 * Le slug est celui de la catégorie (adresses inchangées) ; voir components/ShopTypeIcon.tsx pour les animations.
 */
export type ShopType = { slug: string; name: string; tagline: string; color: string; light: string };

export const SHOP_TYPES: ShopType[] = [
  { slug: "mode", name: "Vêtements", tagline: "Wax, bazin, prêt-à-porter, chaussures. Essayez sur votre photo avant de commander.", color: "#ff5fa2", light: "#ff9cc6" },
  { slug: "electronique", name: "Technologie", tagline: "Consoles, ordinateurs, téléphones, accessoires et énergie solaire.", color: "#22d3ee", light: "#8beafa" },
  { slug: "immobilier", name: "Immobilier", tagline: "Maisons, appartements et terrains, à louer ou à vendre, en visite 360°.", color: "#ff9f43", light: "#ffc58f" },
  { slug: "automobile", name: "Automobile", tagline: "Concessions, voitures neuves et d'occasion, motos et pièces.", color: "#ff4d4f", light: "#ff9596" },
  { slug: "maison", name: "Meubles & déco", tagline: "Salons, lits, rangements, vannerie et objets d'artisans.", color: "#d9824a", light: "#f0b48a" },
  { slug: "beaute", name: "Beauté", tagline: "Karité, savon noir, huiles, parfums et soins naturels.", color: "#e879f9", light: "#f3b4fb" },
  { slug: "alimentation", name: "Épicerie", tagline: "Café, cacao, épices, céréales et produits du terroir.", color: "#84cc16", light: "#bef264" },
  { slug: "gros", name: "Vente en gros", tagline: "Prix dégressifs pour revendeurs, boutiques et restaurants.", color: "#818cf8", light: "#b4bcfc" },
];

export const getShopType = (slug: string) => SHOP_TYPES.find((t) => t.slug === slug);

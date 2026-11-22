/**
 * Les types de boutiques : chacun a sa couleur (cadre, titres, ambiance de sa page) et sa propre animation.
 * Le slug est celui de la catégorie (adresses inchangées) ; voir components/ShopTypeIcon.tsx pour les animations.
 */
/** `light` : teinte foncée de la couleur, pour les textes et icônes sur fond blanc (thème clair). */
export type ShopType = { slug: string; name: string; tagline: string; color: string; light: string };

export const SHOP_TYPES: ShopType[] = [
  { slug: "mode", name: "Vêtements", tagline: "Wax, bazin, prêt-à-porter, chaussures. Essayez sur votre photo avant de commander.", color: "#ff5fa2", light: "#c2296c" },
  { slug: "electronique", name: "Technologie", tagline: "Consoles, ordinateurs, téléphones, accessoires et énergie solaire.", color: "#22d3ee", light: "#0b7f95" },
  { slug: "immobilier", name: "Immobilier", tagline: "Maisons, appartements et terrains, à louer ou à vendre, en visite 360°.", color: "#ff9f43", light: "#b45d0c" },
  { slug: "automobile", name: "Automobile", tagline: "Concessions, voitures neuves et d'occasion, motos et pièces.", color: "#ff4d4f", light: "#c2282b" },
  { slug: "maison", name: "Meubles & déco", tagline: "Salons, lits, rangements, vannerie et objets d'artisans.", color: "#d9824a", light: "#9a5221" },
  { slug: "beaute", name: "Beauté", tagline: "Karité, savon noir, huiles, parfums et soins naturels.", color: "#e879f9", light: "#a333b8" },
  { slug: "alimentation", name: "Épicerie", tagline: "Café, cacao, épices, céréales et produits du terroir.", color: "#84cc16", light: "#4d7c0f" },
  { slug: "gros", name: "Vente en gros", tagline: "Prix dégressifs pour revendeurs, boutiques et restaurants.", color: "#818cf8", light: "#4b55c9" },
];

export const getShopType = (slug: string) => SHOP_TYPES.find((t) => t.slug === slug);

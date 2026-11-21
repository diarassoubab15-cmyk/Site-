/**
 * Données de démonstration.
 * Elles seront remplacées par les tables Supabase (voir supabase/migrations/0001_init.sql).
 * Les pages lisent uniquement via les fonctions exportées ici : brancher Supabase
 * revient à réécrire ces fonctions, sans toucher aux pages.
 */
import type { PaymentMethodId } from "./payments";

export type Category = { slug: string; name: string; description: string; icon: string };

export type Shop = {
  slug: string;
  name: string;
  city: string;
  country: string;
  description: string;
  since: string;
  verified: boolean;
  responseTime: string;
  acceptsCashOnDelivery: boolean;
  payments: PaymentMethodId[];
};

export type Product = {
  slug: string;
  name: string;
  shop: string; // slug de la boutique
  category: string; // slug de la catégorie
  price: number;
  compareAt?: number;
  stock: number;
  wholesale?: { minQty: number; price: number };
  short: string;
  description: string;
  specs: [string, string][];
  glyph: string;
  tone: string; // teinte de la vignette
  /** Unité du prix pour une location (« / mois »). */
  priceUnit?: "mois" | "nuit" | "jour";
  /** Vraies photos (adresses publiques), dans l'ordre. */
  images?: string[];
  /** Panoramas 360° par pièce (visite immobilière). */
  panos?: { url: string; label: string }[];
};

export type Review = {
  id: string;
  product: string;
  author: string;
  city: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  sellerReply?: string;
};

export const categories: Category[] = [
  { slug: "mode", name: "Mode & pagnes", description: "Wax, bazin, prêt-à-porter et accessoires créés en Afrique.", icon: "◆" },
  { slug: "beaute", name: "Beauté & soins", description: "Karité, savons noirs, huiles et cosmétiques naturels.", icon: "✦" },
  { slug: "electronique", name: "Électronique", description: "Téléphones, accessoires, solaire et petit électroménager.", icon: "▣" },
  { slug: "maison", name: "Maison & déco", description: "Vannerie, mobilier, linge et objets d'artisans.", icon: "⌂" },
  { slug: "alimentation", name: "Épicerie", description: "Café, cacao, épices et produits du terroir.", icon: "❋" },
  { slug: "gros", name: "Vente en gros", description: "Prix dégressifs pour revendeurs et commerçants.", icon: "▤" },
  { slug: "immobilier", name: "Immobilier", description: "Maisons, appartements et terrains à louer ou à vendre, avec visite 360°.", icon: "⌂" },
];

export const shops: Shop[] = [
  {
    slug: "atelier-kente",
    name: "Atelier Kenté",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    description: "Créations en wax et bazin cousues à la main à Treichville depuis 2016.",
    since: "2024-02-11",
    verified: true,
    responseTime: "répond en ~1 h",
    acceptsCashOnDelivery: true,
    payments: ["orange_money", "wave", "mtn_momo", "card", "cash_on_delivery"],
  },
  {
    slug: "karite-de-koudougou",
    name: "Karité de Koudougou",
    city: "Koudougou",
    country: "Burkina Faso",
    description: "Coopérative de 40 femmes productrices de beurre de karité brut et de savons.",
    since: "2024-05-03",
    verified: true,
    responseTime: "répond en ~3 h",
    acceptsCashOnDelivery: true,
    payments: ["orange_money", "moov_money", "card", "cash_on_delivery"],
  },
  {
    slug: "dakar-tech",
    name: "Dakar Tech",
    city: "Dakar",
    country: "Sénégal",
    description: "Accessoires téléphone, kits solaires et électronique garantie 12 mois.",
    since: "2023-11-20",
    verified: true,
    responseTime: "répond en ~30 min",
    acceptsCashOnDelivery: true,
    payments: ["wave", "orange_money", "card", "cash_on_delivery"],
  },
  {
    slug: "maison-bamako",
    name: "Maison Bamako",
    city: "Bamako",
    country: "Mali",
    description: "Bogolan, vannerie et mobilier fabriqués par des artisans maliens.",
    since: "2024-08-14",
    verified: true,
    responseTime: "répond en ~4 h",
    acceptsCashOnDelivery: false,
    payments: ["orange_money", "moov_money", "card"],
  },
  {
    slug: "terroir-cameroun",
    name: "Terroir du Cameroun",
    city: "Douala",
    country: "Cameroun",
    description: "Café de l'Ouest, poivre de Penja et cacao en direct des producteurs.",
    since: "2024-01-09",
    verified: true,
    responseTime: "répond en ~2 h",
    acceptsCashOnDelivery: true,
    payments: ["mtn_momo", "orange_money", "card", "cash_on_delivery"],
  },
];

export const products: Product[] = [
  {
    slug: "robe-wax-sanaa",
    name: "Robe wax Sanaa",
    shop: "atelier-kente",
    category: "mode",
    price: 18500,
    compareAt: 22000,
    stock: 14,
    short: "Robe midi en wax 100 % coton, coupe évasée, poches latérales.",
    description:
      "La robe Sanaa est coupée dans un wax 100 % coton à motifs géométriques, doublée au buste. Sa coupe évasée se porte au bureau comme en cérémonie. Chaque pièce est cousue à la main dans notre atelier d'Abidjan : les motifs peuvent légèrement varier d'une robe à l'autre.",
    specs: [["Matière", "Wax 100 % coton"], ["Tailles", "S à XXL"], ["Entretien", "Lavage 30 °C, à l'envers"], ["Fabrication", "Abidjan, Côte d'Ivoire"]],
    glyph: "◆",
    tone: "#9281f7",
  },
  {
    slug: "chemise-bazin-brode",
    name: "Chemise bazin brodé",
    shop: "atelier-kente",
    category: "mode",
    price: 24000,
    stock: 6,
    short: "Bazin riche teint à la main, broderie ton sur ton au col.",
    description:
      "Chemise homme en bazin riche teint à la main, broderie fine au col et aux poignets. Coupe droite, manches longues. Idéale pour les fêtes et les mariages.",
    specs: [["Matière", "Bazin riche"], ["Tailles", "M à 3XL"], ["Entretien", "Lavage à la main"], ["Fabrication", "Abidjan, Côte d'Ivoire"]],
    glyph: "◇",
    tone: "#70b8ff",
  },
  {
    slug: "beurre-karite-brut-500g",
    name: "Beurre de karité brut 500 g",
    shop: "karite-de-koudougou",
    category: "beaute",
    price: 4500,
    stock: 120,
    wholesale: { minQty: 20, price: 3200 },
    short: "Karité non raffiné, pressé à froid, sans parfum ajouté.",
    description:
      "Beurre de karité brut extrait à la main par la coopérative, filtré et conditionné en pot de 500 g. Il nourrit la peau et les cheveux. Sans conservateur ni parfum.",
    specs: [["Poids", "500 g"], ["Origine", "Koudougou, Burkina Faso"], ["Composition", "100 % Butyrospermum parkii"], ["Conservation", "24 mois, à l'abri de la chaleur"]],
    glyph: "✦",
    tone: "#ffca16",
  },
  {
    slug: "savon-noir-karite",
    name: "Savon noir au karité (lot de 3)",
    shop: "karite-de-koudougou",
    category: "beaute",
    price: 3000,
    stock: 200,
    wholesale: { minQty: 50, price: 2100 },
    short: "Savon traditionnel saponifié à froid, enrichi en karité.",
    description:
      "Trois pains de savon noir fabriqués à partir de cendres végétales et de beurre de karité. Convient au visage, au corps et aux peaux sensibles.",
    specs: [["Contenu", "3 × 150 g"], ["Origine", "Burkina Faso"], ["Peau", "Tous types"]],
    glyph: "●",
    tone: "#3ad389",
  },
  {
    slug: "kit-solaire-maison-100w",
    name: "Kit solaire maison 100 W",
    shop: "dakar-tech",
    category: "electronique",
    price: 89000,
    compareAt: 99000,
    stock: 9,
    short: "Panneau 100 W, batterie lithium, 4 ampoules LED et ports USB.",
    description:
      "Kit complet pour éclairer une maison et recharger les téléphones : panneau monocristallin 100 W, batterie lithium 30 Ah, 4 ampoules LED avec câbles et 2 ports USB. Installation sans électricien. Garantie 12 mois assurée par le vendeur.",
    specs: [["Panneau", "100 W monocristallin"], ["Batterie", "Lithium 12 V 30 Ah"], ["Autonomie", "≈ 10 h d'éclairage"], ["Garantie", "12 mois vendeur"]],
    glyph: "☀",
    tone: "#ffd60a",
  },
  {
    slug: "batterie-externe-20000",
    name: "Batterie externe 20 000 mAh",
    shop: "dakar-tech",
    category: "electronique",
    price: 15000,
    stock: 40,
    wholesale: { minQty: 10, price: 11500 },
    short: "Charge rapide USB-C 22,5 W, deux sorties, écran de charge.",
    description:
      "Batterie externe 20 000 mAh, charge rapide 22,5 W en USB-C, 2 sorties USB-A, affichage du niveau. Recharge un smartphone 4 à 5 fois.",
    specs: [["Capacité", "20 000 mAh"], ["Charge", "22,5 W USB-C PD"], ["Poids", "380 g"], ["Garantie", "12 mois vendeur"]],
    glyph: "▣",
    tone: "#3b9eff",
  },
  {
    slug: "panier-tresse-bamako",
    name: "Panier tressé de Bamako",
    shop: "maison-bamako",
    category: "maison",
    price: 12000,
    stock: 18,
    short: "Panier de rangement en fibres végétales, tressé à la main.",
    description:
      "Grand panier rond tressé en fibres de palmier, anses en cuir. Parfait pour le linge, les jouets ou les plantes. Chaque panier est unique.",
    specs: [["Diamètre", "40 cm"], ["Hauteur", "45 cm"], ["Matière", "Palmier et cuir"], ["Fabrication", "Bamako, Mali"]],
    glyph: "⌂",
    tone: "#ff9592",
  },
  {
    slug: "plaid-bogolan",
    name: "Plaid bogolan",
    shop: "maison-bamako",
    category: "maison",
    price: 27500,
    stock: 5,
    short: "Tissu teint à la terre selon la technique traditionnelle.",
    description:
      "Plaid en coton tissé main et teint à la terre selon la technique du bogolan. Motifs symboliques peints à la main. Se pose sur un canapé ou au mur.",
    specs: [["Dimensions", "140 × 200 cm"], ["Matière", "Coton tissé main"], ["Entretien", "Lavage à froid, à la main"]],
    glyph: "▦",
    tone: "#baa7ff",
  },
  {
    slug: "cafe-arabica-ouest-1kg",
    name: "Café arabica de l'Ouest 1 kg",
    shop: "terroir-cameroun",
    category: "alimentation",
    price: 9500,
    stock: 60,
    wholesale: { minQty: 25, price: 7400 },
    short: "Grains torréfiés la semaine de l'envoi, notes de cacao.",
    description:
      "Café arabica cultivé en altitude dans l'Ouest du Cameroun, torréfié artisanalement à Douala la semaine de l'expédition. Disponible en grains ou moulu.",
    specs: [["Poids", "1 kg"], ["Torréfaction", "Moyenne"], ["Origine", "Ouest, Cameroun"]],
    glyph: "❋",
    tone: "#ff6465",
  },
  {
    slug: "poivre-penja-blanc",
    name: "Poivre blanc de Penja 100 g",
    shop: "terroir-cameroun",
    category: "alimentation",
    price: 6500,
    stock: 80,
    short: "Poivre à indication géographique, cultivé sur sol volcanique.",
    description:
      "Le poivre blanc de Penja pousse sur les sols volcaniques du Moungo. Arômes intenses et légèrement musqués. Sachet refermable de 100 g.",
    specs: [["Poids", "100 g"], ["Origine", "Penja, Cameroun"], ["Label", "Indication géographique protégée"]],
    glyph: "∴",
    tone: "#f0f0f0",
  },
  {
    slug: "lot-pagnes-wax-12",
    name: "Lot de 12 pagnes wax (revendeurs)",
    shop: "atelier-kente",
    category: "gros",
    price: 96000,
    stock: 30,
    wholesale: { minQty: 5, price: 84000 },
    short: "12 pièces de 6 yards, motifs assortis, pour revendeurs.",
    description:
      "Lot de 12 pagnes wax de 6 yards en motifs assortis. Prix dégressif à partir de 5 lots. Facture fournie pour les commerçants.",
    specs: [["Contenu", "12 × 6 yards"], ["Matière", "Coton"], ["Facture", "Oui"]],
    glyph: "▤",
    tone: "#9281f7",
  },
  {
    slug: "ecouteurs-sans-fil-pro",
    name: "Écouteurs sans fil Pro",
    shop: "dakar-tech",
    category: "electronique",
    price: 21000,
    stock: 0,
    short: "Réduction de bruit, 30 h d'autonomie avec le boîtier.",
    description:
      "Écouteurs Bluetooth 5.3 avec réduction de bruit active, résistance à la sueur et 30 h d'autonomie avec le boîtier de charge.",
    specs: [["Bluetooth", "5.3"], ["Autonomie", "30 h avec boîtier"], ["Garantie", "12 mois vendeur"]],
    glyph: "◎",
    tone: "#70b8ff",
  },
];

export const reviews: Review[] = [
  { id: "r1", product: "robe-wax-sanaa", author: "Aïcha K.", city: "Abidjan", rating: 5, title: "Magnifique et bien cousue", body: "La robe est encore plus belle qu'en photo, les finitions sont propres. J'ai payé à la livraison, le livreur était à l'heure.", date: "2026-10-02", verified: true, sellerReply: "Merci Aïcha, au plaisir de vous habiller à nouveau !" },
  { id: "r2", product: "robe-wax-sanaa", author: "Mariam D.", city: "Bouaké", rating: 4, title: "Taille un peu grand", body: "Très joli tissu. Prenez une taille en dessous. Le vendeur a accepté l'échange sans discuter.", date: "2026-09-18", verified: true },
  { id: "r3", product: "beurre-karite-brut-500g", author: "Fatou S.", city: "Dakar", rating: 5, title: "Vrai karité brut", body: "Odeur naturelle, texture parfaite. Payé avec Wave en deux clics.", date: "2026-10-21", verified: true },
  { id: "r4", product: "beurre-karite-brut-500g", author: "Jean-Marc O.", city: "Lomé", rating: 5, title: "Commande en gros sans souci", body: "J'ai pris 30 pots pour ma boutique, le prix de gros s'applique tout seul au panier.", date: "2026-08-30", verified: true },
  { id: "r5", product: "kit-solaire-maison-100w", author: "Moussa T.", city: "Thiès", rating: 4, title: "Fonctionne bien", body: "Installé en une heure. Une ampoule défectueuse, remplacée par le vendeur en 3 jours.", date: "2026-10-11", verified: true, sellerReply: "Désolé pour l'ampoule, merci pour votre patience." },
  { id: "r6", product: "kit-solaire-maison-100w", author: "Clarisse B.", city: "Ziguinchor", rating: 5, title: "Enfin de la lumière le soir", body: "La batterie tient toute la nuit. Livraison en 4 jours.", date: "2026-09-05", verified: true },
  { id: "r7", product: "cafe-arabica-ouest-1kg", author: "Paul E.", city: "Yaoundé", rating: 5, title: "Excellent café", body: "Torréfaction récente, ça se sent. Je recommande en grains.", date: "2026-10-28", verified: true },
  { id: "r8", product: "batterie-externe-20000", author: "Ibrahima N.", city: "Dakar", rating: 3, title: "Correct", body: "Charge bien mais un peu lourde. Conforme à la description.", date: "2026-09-12", verified: true },
  { id: "r9", product: "panier-tresse-bamako", author: "Sophie M.", city: "Abidjan", rating: 5, title: "Très beau travail", body: "Solide et joli, bien emballé.", date: "2026-10-15", verified: true },
  { id: "r10", product: "plaid-bogolan", author: "Awa C.", city: "Bamako", rating: 5, title: "Superbe", body: "Les motifs sont magnifiques, très bonne qualité de coton.", date: "2026-07-22", verified: true },
];

// ---------------------------------------------------------------- lecture

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getShop = (slug: string) => shops.find((s) => s.slug === slug);
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const productsByShop = (slug: string) => products.filter((p) => p.shop === slug);
export const productsByCategory = (slug: string) => products.filter((p) => p.category === slug);
export const reviewsFor = (slug: string) => reviews.filter((r) => r.product === slug);

export function ratingFor(slug: string) {
  const list = reviewsFor(slug);
  if (!list.length) return { average: 0, count: 0 };
  const average = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { average: Math.round(average * 10) / 10, count: list.length };
}

export function shopRating(slug: string) {
  const list = productsByShop(slug).flatMap((p) => reviewsFor(p.slug));
  if (!list.length) return { average: 0, count: 0 };
  return { average: Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10, count: list.length };
}

export function searchProducts(q: string, category?: string) {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const needle = norm(q.trim());
  return products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!needle || norm(`${p.name} ${p.short} ${getShop(p.shop)?.name ?? ""}`).includes(needle)),
  );
}

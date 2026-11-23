/**
 * Sous-parties d'une catégorie (pour l'instant : Technologie).
 * Le vendeur choisit la sous-partie de son produit ; à défaut, elle est devinée d'après le nom.
 */
export type Subcategory = { slug: string; name: string; icon: string; keywords: string[] };

export const SUBCATEGORIES: Record<string, Subcategory[]> = {
  electronique: [
    { slug: "telephones", name: "Téléphones", icon: "📱", keywords: ["telephone", "smartphone", "iphone", "samsung galaxy", "tecno", "infinix", "itel", "redmi", "xiaomi", "portable"] },
    { slug: "ordinateurs", name: "Ordinateurs", icon: "💻", keywords: ["ordinateur", "laptop", "pc", "macbook", "elitebook", "thinkpad", "dell", "lenovo", "hp ", "imac", "unite centrale"] },
    { slug: "televisions", name: "Télévisions", icon: "📺", keywords: ["television", "televiseur", "tv", "smart tv", "ecran plat", "decodeur", "canal+"] },
    { slug: "consoles", name: "PlayStation & jeux", icon: "🎮", keywords: ["playstation", "ps5", "ps4", "xbox", "nintendo", "switch", "console", "manette", "jeu video"] },
    { slug: "tablettes", name: "Tablettes", icon: "📲", keywords: ["tablette", "ipad", "galaxy tab"] },
    { slug: "audio", name: "Son & écouteurs", icon: "🎧", keywords: ["ecouteur", "casque", "airpods", "enceinte", "baffle", "barre de son", "bluetooth", "radio"] },
    { slug: "photo", name: "Photo & vidéo", icon: "📷", keywords: ["appareil photo", "camera", "canon", "nikon", "gopro", "drone", "trepied"] },
    { slug: "electromenager", name: "Électroménager", icon: "🧊", keywords: ["frigo", "refrigerateur", "congelateur", "climatiseur", "ventilateur", "micro-ondes", "machine a laver", "cuisiniere", "mixeur", "fer a repasser"] },
    { slug: "energie", name: "Solaire & énergie", icon: "☀️", keywords: ["solaire", "panneau", "batterie", "onduleur", "groupe electrogene", "powerbank", "batterie externe", "stabilisateur"] },
    { slug: "accessoires", name: "Accessoires", icon: "🔌", keywords: ["chargeur", "cable", "coque", "souris", "clavier", "cle usb", "disque dur", "carte memoire", "routeur", "imprimante"] },
  ],
};

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const subcategoriesOf = (category: string) => SUBCATEGORIES[category] ?? [];
export const getSubcategory = (category: string, slug?: string | null) => (slug ? subcategoriesOf(category).find((s) => s.slug === slug) : undefined);

/** Sous-partie d'un produit : celle choisie par le vendeur, sinon devinée d'après le nom puis la description. */
export function subcategoryOf(p: { category: string; subcategory?: string | null; name: string; short?: string }): string | null {
  const list = subcategoriesOf(p.category);
  if (!list.length) return null;
  if (p.subcategory && list.some((s) => s.slug === p.subcategory)) return p.subcategory;
  for (const text of [p.name, p.short ?? ""]) {
    const t = ` ${norm(text)} `;
    // Le mot-clé le plus long gagne (« batterie externe » avant « batterie »).
    let best: string | null = null;
    let len = 0;
    for (const s of list) for (const k of s.keywords) if (k.length > len && t.includes(k)) { best = s.slug; len = k.length; }
    if (best) return best;
  }
  return null;
}

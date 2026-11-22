/**
 * Photos d'ambiance de chaque type de boutique (public/fonds), affichées en arrière-plan
 * tant que les vendeurs n'ont pas assez de vraies photos de produits.
 * Beauté : un seul gros plan provisoire, en attendant sa propre photo.
 */
const COUNT: Record<string, number> = { immobilier: 3, mode: 3, electronique: 3, automobile: 3, maison: 3, beaute: 1, alimentation: 3, gros: 3 };

export const categoryPhotos = (slug: string): string[] =>
  Array.from({ length: COUNT[slug] ?? 0 }, (_, i) => `/fonds/${slug}-${i + 1}.webp`);

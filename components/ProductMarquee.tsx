import type { Product } from "@/lib/data";
import { ProductThumb } from "./ProductThumb";
import { ShopTypeIcon } from "./ShopTypeIcon";
import { SHOP_TYPES } from "@/lib/shop-types";
import { categoryPhotos } from "@/lib/category-photos";

/**
 * Produits qui défilent en arrière-plan (motion design, CSS seul, transform uniquement).
 * Décoratif : masqué aux lecteurs d'écran et non cliquable. Le contenu est doublé pour une boucle sans saut.
 * Peu de produits : on complète avec les photos d'ambiance de la catégorie (à défaut, ses icônes animées).
 */
export function ProductMarquee({ products, type, rows = 2, className = "" }: { products: Product[]; type?: string; rows?: number; className?: string }) {
  const types = type ? SHOP_TYPES.filter((t) => t.slug === type) : SHOP_TYPES;
  // Seulement les produits avec une vraie photo : l'arrière-plan reste photographique.
  const productItems = products.filter((p) => p.images?.length).map((p) => <div key={p.slug} className="marquee-item"><ProductThumb product={p} /></div>);
  // Photos d'ambiance de la (ou des) catégorie(s), en alternance, pour compléter s'il y a peu de produits.
  const lists = types.map((t) => categoryPhotos(t.slug).map((src) => ({ src, t })));
  const photos = Array.from({ length: Math.max(0, ...lists.map((l) => l.length)) }, (_, i) => lists.map((l) => l[i]).filter(Boolean)).flat();
  const photoItems = photos.map(({ src, t }) => (
    <div key={src} className="marquee-item marquee-photo" style={{ ["--c" as string]: t.color }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- petites images déjà optimisées (WebP 400 px) */}
      <img src={src} alt="" width={400} height={400} loading="lazy" decoding="async" />
    </div>
  ));
  const iconItems = Array.from({ length: 8 }, (_, i) => {
    const t = types[i % types.length];
    return (
      <div key={`${t.slug}-${i}`} className="marquee-item marquee-icon" style={{ ["--c" as string]: t.color, color: t.light }}>
        <ShopTypeIcon slug={t.slug} size={44} />
      </div>
    );
  });
  const items: React.ReactNode[] =
    productItems.length >= 8 ? productItems
    : productItems.length + photoItems.length ? [...productItems, ...photoItems]
    : iconItems;
  // Assez d'éléments pour couvrir les grands écrans, puis doublés pour la boucle.
  const base = items.length >= 8 ? items : Array.from({ length: Math.ceil(8 / items.length) }, () => items).flat();
  return (
    <div className={`marquee ${className}`} aria-hidden="true" inert>
      {Array.from({ length: rows }, (_, r) => {
        const row = r % 2 ? [...base].reverse() : base;
        return (
          <div key={r} className="marquee-row" data-dir={r % 2 ? "right" : "left"} style={{ ["--n" as string]: row.length }}>
            <div className="marquee-track">{row.map((n, i) => <div key={`a${i}`}>{n}</div>)}{row.map((n, i) => <div key={`b${i}`}>{n}</div>)}</div>
          </div>
        );
      })}
    </div>
  );
}

import type { Product } from "@/lib/data";
import { ProductThumb } from "./ProductThumb";
import { ShopTypeIcon } from "./ShopTypeIcon";
import { SHOP_TYPES } from "@/lib/shop-types";

/**
 * Produits qui défilent en arrière-plan (motion design, CSS seul, transform uniquement).
 * Décoratif : masqué aux lecteurs d'écran et non cliquable. Le contenu est doublé pour une boucle sans saut.
 * Sans produit (catégorie encore vide), on fait défiler les icônes animées des catégories.
 */
export function ProductMarquee({ products, type, rows = 2, className = "" }: { products: Product[]; type?: string; rows?: number; className?: string }) {
  const types = type ? SHOP_TYPES.filter((t) => t.slug === type) : SHOP_TYPES;
  const items: React.ReactNode[] = products.length
    ? products.map((p) => <div key={p.slug} className="marquee-item"><ProductThumb product={p} /></div>)
    : Array.from({ length: 8 }, (_, i) => {
        const t = types[i % types.length];
        return (
          <div key={`${t.slug}-${i}`} className="marquee-item marquee-icon" style={{ ["--c" as string]: t.color, color: t.light }}>
            <ShopTypeIcon slug={t.slug} size={44} />
          </div>
        );
      });
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

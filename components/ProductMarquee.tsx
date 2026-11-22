import Link from "next/link";
import type { Product } from "@/lib/data";
import { ShopTypeIcon } from "./ShopTypeIcon";
import { SHOP_TYPES } from "@/lib/shop-types";
import { categoryPhotos } from "@/lib/category-photos";
import { formatPrice } from "@/lib/format";

type Item = { key: string; href: string; img?: string; title: string; sub?: string; color: string; slug: string };

/**
 * Produits qui défilent (motion design, CSS seul, transform uniquement), façon « constellation » :
 *  - variant="band"  : rangées de cartes blanches arrondies qui flottent (photo + nom), cliquables ;
 *  - variant="strip" : petite bande de vignettes, dans une carte de catégorie.
 * Les vraies photos des produits passent en premier ; s'il y en a peu, on complète avec les photos
 * d'ambiance de la catégorie (à défaut, ses icônes). Le contenu est doublé pour une boucle sans saut :
 * la copie est masquée aux lecteurs d'écran et au clavier. Le défilement s'arrête au survol.
 */
export function ProductMarquee({ products, type, rows = 2, variant = "band" }: { products: Product[]; type?: string; rows?: number; variant?: "band" | "strip" }) {
  const types = type ? SHOP_TYPES.filter((t) => t.slug === type) : SHOP_TYPES;
  const typeOf = (slug: string) => SHOP_TYPES.find((t) => t.slug === slug) ?? types[0];

  const productItems: Item[] = products.filter((p) => p.images?.length).map((p) => ({
    key: p.slug, href: `/produits/${p.slug}`, img: p.images![0], title: p.name, sub: formatPrice(p.price), color: typeOf(p.category).color, slug: p.category,
  }));
  const lists = types.map((t) => categoryPhotos(t.slug).map((src) => ({ src, t })));
  const photoItems: Item[] = Array.from({ length: Math.max(0, ...lists.map((l) => l.length)) }, (_, i) => lists.map((l) => l[i]).filter(Boolean)).flat()
    .map(({ src, t }) => ({ key: src, href: `/categories/${t.slug}`, img: src, title: t.name, color: t.color, slug: t.slug }));
  let items = productItems.length >= 8 ? productItems : [...productItems, ...photoItems];
  if (!items.length) items = types.map((t) => ({ key: t.slug, href: `/categories/${t.slug}`, title: t.name, color: t.color, slug: t.slug }));
  // Assez d'éléments pour couvrir les grands écrans.
  const base = items.length >= 8 ? items : Array.from({ length: Math.ceil(8 / items.length) }, (_, k) => items.map((it) => ({ ...it, key: `${it.key}~${k}` }))).flat();

  const card = (it: Item, copy: boolean) => {
    const inner = variant === "strip" ? (
      it.img
        // eslint-disable-next-line @next/next/no-img-element -- petites images déjà optimisées
        ? <img src={it.img} alt="" width={120} height={120} loading="lazy" decoding="async" />
        : <span style={{ color: it.color }}><ShopTypeIcon slug={it.slug} size={28} /></span>
    ) : (
      <>
        <span className="float-img">
          {it.img
            // eslint-disable-next-line @next/next/no-img-element -- images déjà optimisées (WebP)
            ? <img src={it.img} alt="" width={400} height={400} loading="lazy" decoding="async" />
            : <span className="flex h-full w-full items-center justify-center" style={{ color: it.color }}><ShopTypeIcon slug={it.slug} size={56} /></span>}
        </span>
        <span className="float-label">
          <span className="float-dot" style={{ background: it.color }} aria-hidden="true" />
          <span className="truncate">{it.title}</span>
        </span>
        {it.sub && <span className="float-sub">{it.sub}</span>}
      </>
    );
    if (variant === "strip") return <span key={`${copy ? "b" : "a"}-${it.key}`} className="strip-item">{inner}</span>;
    return copy
      ? <span key={`b-${it.key}`} className="float-card">{inner}</span>
      : <Link key={`a-${it.key}`} href={it.href} className="float-card" data-haptic>{inner}</Link>;
  };

  return (
    <div className={variant === "strip" ? "strip" : "float-band"} aria-hidden={variant === "strip" ? true : undefined}>
      {Array.from({ length: rows }, (_, r) => {
        const row = r % 2 ? [...base].reverse() : base;
        return (
          <div key={r} className="marquee-row" data-dir={r % 2 ? "right" : "left"} style={{ ["--n" as string]: row.length }}>
            <div className="marquee-track">
              <div className="marquee-set">{row.map((it) => card(it, false))}</div>
              <div className="marquee-set" aria-hidden="true" inert>{row.map((it) => card(it, true))}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

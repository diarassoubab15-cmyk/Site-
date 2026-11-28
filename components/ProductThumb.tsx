import type { Product } from "@/lib/data";
import { categoryPhotos } from "@/lib/category-photos";

/** Choix stable d'une photo d'ambiance pour un produit sans photo (même produit, même image). */
const ambiance = (p: Product) => {
  const list = categoryPhotos(p.category);
  if (!list.length) return null;
  let h = 0;
  for (const ch of p.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
};

/** Vignette produit : la vraie photo si le vendeur en a envoyé, sinon une vignette générée. */
export function ProductThumb({ product, large = false }: { product: Product; large?: boolean }) {
  const photo = product.images?.[0];
  if (photo) {
    return (
      <div className={`relative aspect-square overflow-hidden border border-line bg-lift ${large ? "rounded-[16px]" : "rounded-[12px]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- images déjà compressées à l'envoi (WebP) */}
        <img src={photo} alt={product.name} loading={large ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
        {product.panos?.length || (product.spin?.length ?? 0) >= 8 ? <span className="badge absolute left-3 top-3 border-white/20 bg-black/60 text-white backdrop-blur-[25px]">360°</span> : null}
      </div>
    );
  }
  // Pas encore de photo du vendeur : photo d'ambiance de la catégorie, signalée comme illustration
  // (jamais présentée comme la photo du produit).
  const amb = ambiance(product);
  if (amb) {
    return (
      <div className={`relative aspect-square overflow-hidden border border-line bg-lift ${large ? "rounded-[16px]" : "rounded-[12px]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- photos d'ambiance déjà compressées (WebP) */}
        <img src={amb} alt="" loading={large ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
        <span className="thumb-note">Photo d&apos;illustration</span>
      </div>
    );
  }
  return (
    <div
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[12px] border border-line ${large ? "rounded-[16px]" : ""}`}
      style={{ background: `radial-gradient(120% 90% at 30% 20%, ${product.tone}22 0%, #0b0e14 55%, #000 100%)` }}
      role="img"
      aria-label={product.name}
    >
      <span className={`${large ? "text-[120px]" : "text-6xl"} leading-none`} style={{ color: product.tone }} aria-hidden="true">
        {product.glyph}
      </span>
    </div>
  );
}

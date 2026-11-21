import type { Product } from "@/lib/data";

/** Vignette produit : la vraie photo si le vendeur en a envoyé, sinon une vignette générée. */
export function ProductThumb({ product, large = false }: { product: Product; large?: boolean }) {
  const photo = product.images?.[0];
  if (photo) {
    return (
      <div className={`relative aspect-square overflow-hidden border border-line bg-lift ${large ? "rounded-[16px]" : "rounded-[12px]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- images déjà compressées à l'envoi (WebP) */}
        <img src={photo} alt={product.name} loading={large ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
        {product.panos?.length ? <span className="badge absolute left-3 top-3 border-white/20 bg-black/60 text-white backdrop-blur-[25px]">360°</span> : null}
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

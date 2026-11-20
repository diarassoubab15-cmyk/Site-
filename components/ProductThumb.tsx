import type { Product } from "@/lib/data";

/** Vignette produit générée (en attendant les vraies photos stockées dans Supabase Storage). */
export function ProductThumb({ product, large = false }: { product: Product; large?: boolean }) {
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

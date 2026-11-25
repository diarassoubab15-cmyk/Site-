import Link from "next/link";
import type { CardItem } from "@/lib/catalog";
import { formatPrice, formatPriceUnit } from "@/lib/format";
import { ProductThumb } from "./ProductThumb";
import { Stars } from "./Stars";

export function ProductCard({ item }: { item: CardItem }) {
  const { product, shop, rating } = item;
  return (
    <article className="lift group relative flex flex-col gap-4 rounded-[16px] border border-line p-3 hover:border-iron">
      <ProductThumb product={product} />
      <div className="flex flex-1 flex-col gap-1.5 px-1 pb-1">
        <h3 className="text-[15px] font-medium leading-snug text-white">
          <Link href={`/produits/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-ash">
          {shop?.name}
          {shop?.verified && <span className="ml-1.5 text-pulse" title="Vendeur vérifié par NEXORA">✓</span>}
        </p>
        {(product.madeInMali || product.handmade) && (
          <p className="flex flex-wrap gap-1 text-[11px]">
            {product.madeInMali && <span className="rounded-full bg-[#e9f8ef] px-2 py-0.5 text-[#0f6b3f]">🇲🇱 Fait au Mali</span>}
            {product.handmade && <span className="rounded-full bg-[#fff6e5] px-2 py-0.5 text-[#8a5a00]">✋ Fait main</span>}
          </p>
        )}
        {rating.count > 0 && (
          <p className="flex items-center gap-2 text-xs text-ash">
            <Stars value={rating.average} size="text-xs" /> {rating.average} ({rating.count})
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-mono text-sm text-white">{formatPriceUnit(product.price, product.priceUnit)}</span>
          {product.compareAt && <s className="font-mono text-xs text-iron">{formatPrice(product.compareAt)}</s>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {shop?.acceptsCashOnDelivery && <span className="badge">Paiement à la livraison</span>}
          {product.wholesale && <span className="badge">Prix de gros</span>}
          {product.stock === 0 && <span className="badge text-alarm">Rupture</span>}
        </div>
      </div>
    </article>
  );
}

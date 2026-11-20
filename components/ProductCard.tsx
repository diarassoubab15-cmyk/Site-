import Link from "next/link";
import { getShop, ratingFor, type Product } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { ProductThumb } from "./ProductThumb";
import { Stars } from "./Stars";

export function ProductCard({ product }: { product: Product }) {
  const shop = getShop(product.shop);
  const rating = ratingFor(product.slug);
  return (
    <article className="group relative flex flex-col gap-4 rounded-[16px] border border-line p-3 transition-colors duration-150 hover:border-iron">
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
        {rating.count > 0 && (
          <p className="flex items-center gap-2 text-xs text-ash">
            <Stars value={rating.average} size="text-xs" /> {rating.average} ({rating.count})
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-mono text-sm text-white">{formatPrice(product.price)}</span>
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

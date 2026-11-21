import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaManager } from "@/components/MediaManager";
import { ProductEditor } from "@/components/ProductEditor";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadSellerProducts } from "@/lib/server-data";

export const metadata: Metadata = { title: "Modifier le produit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ModifierProduit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = supabaseEnabled ? await loadSellerProducts() : null;
  if (!data?.shop) redirect("/vendeur/produits");
  const product = data.products.find((p) => p.id === id);
  if (!product) notFound();
  return (
    <section className="container-x max-w-4xl space-y-8 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/vendeur/produits" className="text-sm text-ash hover:text-white">← Mes produits</Link>
          <h1 className="h-section mt-4 text-4xl">{product.name}</h1>
        </div>
        {product.published && <Link href={`/produits/${product.slug}`} prefetch={false} className="btn">Voir la fiche publique</Link>}
      </div>
      <MediaManager shopId={data.shop.id} productId={product.id} kind="photo" items={product.media} />
      {product.category === "immobilier" && <MediaManager shopId={data.shop.id} productId={product.id} kind="pano" items={product.media} />}
      <ProductEditor product={product} />
    </section>
  );
}

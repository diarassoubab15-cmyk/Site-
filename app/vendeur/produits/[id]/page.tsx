import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaManager } from "@/components/MediaManager";
import { ProductEditor } from "@/components/ProductEditor";
import { ProductEditRequests } from "@/components/ProductEditRequests";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadEditRequests, loadSellerProducts } from "@/lib/server-data";

export const metadata: Metadata = { title: "Modifier le produit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ModifierProduit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = supabaseEnabled ? await loadSellerProducts() : null;
  if (!data?.shop) redirect("/vendeur/produits");
  const product = data.products.find((p) => p.id === id);
  if (!product) notFound();
  const edits = await loadEditRequests(product.id);
  return (
    <section className="container-x max-w-4xl space-y-8 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/vendeur/produits" className="text-sm text-ash hover:text-white">← Mes produits</Link>
          <h1 className="h-section mt-4 text-4xl">{product.name}</h1>
        </div>
        {product.published && <Link href={`/produits/${product.slug}`} prefetch={false} className="btn">Voir la fiche publique</Link>}
      </div>
      <ProductEditRequests productId={product.id} requests={edits} />
      <MediaManager shopId={data.shop.id} productId={product.id} kind="photo" items={product.media} />
      {product.category === "immobilier" ? (
        <MediaManager shopId={data.shop.id} productId={product.id} kind="pano" items={product.media} />
      ) : product.category === "automobile" ? (
        <>
          <MediaManager shopId={data.shop.id} productId={product.id} kind="spin" items={product.media} title="Rotation 360° de la voiture"
            help="Garez la voiture dans un endroit dégagé et prenez 24 à 36 photos en faisant le tour, à la même hauteur et à la même distance. Envoyez-les toutes d'un coup : elles sont rangées dans l'ordre de prise de vue. Le client fait tourner la voiture du doigt (à partir de 8 photos)." />
          <MediaManager shopId={data.shop.id} productId={product.id} kind="pano" items={product.media} title="Intérieur 360°"
            help="Une photo 360° (format 2:1) prise depuis la place du conducteur, puis depuis l'arrière ou le coffre, avec une caméra 360° ou l'application « photo sphère ». Nommez chaque vue (Conducteur, Arrière, Coffre…)." />
        </>
      ) : (
        <MediaManager shopId={data.shop.id} productId={product.id} kind="spin" items={product.media} />
      )}
      <ProductEditor product={product} />
    </section>
  );
}

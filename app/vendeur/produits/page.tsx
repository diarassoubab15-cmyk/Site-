import type { Metadata } from "next";
import Link from "next/link";
import { DemoNotice } from "@/components/DemoNotice";
import { formatPriceUnit } from "@/lib/format";
import { categories } from "@/lib/data";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadSellerProducts } from "@/lib/server-data";

export const metadata: Metadata = { title: "Mes produits", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MesProduits() {
  const data = supabaseEnabled ? await loadSellerProducts() : null;
  const approved = data?.shop?.status === "approved";
  return (
    <section className="container-x py-16">
      <Link href="/vendeur" className="text-sm text-ash hover:text-white">← Espace vendeur</Link>
      <div className="mb-8 mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-section text-4xl sm:text-5xl">Mes produits</h1>
        {approved && <Link href="/vendeur/produits/nouveau" className="btn-solid">+ Ajouter un produit</Link>}
      </div>
      <DemoNotice>la gestion des produits et l&apos;envoi de photos nécessitent Supabase.</DemoNotice>
      {supabaseEnabled && !approved && <p className="card text-ash">Vous pourrez ajouter vos produits dès que l&apos;administrateur aura autorisé votre boutique.</p>}
      {approved && data!.products.length === 0 && <p className="card text-ash">Aucun produit pour l&apos;instant. Ajoutez le premier, puis ses photos.</p>}
      {approved && data!.products.length > 0 && (
        <ul className="grid gap-3" data-reveal suppressHydrationWarning>
          {data!.products.map((p) => {
            const photo = p.media.find((m) => m.kind === "photo");
            const panos = p.media.filter((m) => m.kind === "pano").length;
            return (
              <li key={p.id}>
                <Link href={`/vendeur/produits/${p.id}`} className="lift flex items-center gap-4 rounded-[16px] border border-line p-3 hover:border-iron">
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border border-line bg-lift">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {photo && <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-white">{p.name}</span>
                    <span className="block text-xs text-ash">
                      {categories.find((c) => c.slug === p.category)?.name} · <span className="font-mono">{formatPriceUnit(p.price, p.priceUnit)}</span> · {p.media.filter((m) => m.kind === "photo").length} photo(s){panos ? ` · ${panos} pièce(s) en 360°` : ""}
                    </span>
                  </span>
                  <span className={`badge ${p.published ? "text-pulse" : "text-iron"}`}>{p.published ? "visible" : "masqué"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

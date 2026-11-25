import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { listCards } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Fait au Mali et fait main : les artisans de NEXORA",
  description: "Wax, bogolan, vannerie, karité, bijoux : les produits fabriqués au Mali et faits main par les artisans vérifiés de NEXORA.",
  alternates: { canonical: "/artisans" },
};
export const revalidate = 300;

/** Vitrine des artisans : produits « Fabriqué au Mali » et « Fait main », choisis par les vendeurs. */
export default async function Artisans({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const { filtre } = await searchParams;
  const all = (await listCards({ limit: 500 })).filter((c) => c.product.madeInMali || c.product.handmade);
  const items = filtre === "mali" ? all.filter((c) => c.product.madeInMali) : filtre === "main" ? all.filter((c) => c.product.handmade) : all;
  const tabs: [string | undefined, string][] = [[undefined, "Tout"], ["mali", "🇲🇱 Fabriqué au Mali"], ["main", "✋ Fait main"]];
  return (
    <section className="container-x py-16">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Artisans", href: "/artisans" }]} />
      <h1 className="h-section">Les artisans du Mali</h1>
      <p className="mb-8 mt-4 max-w-2xl text-ash">Des pièces uniques, faites à la main ou fabriquées au Mali. En les achetant, vous payez directement l&apos;artisan, sans commission.</p>
      <nav aria-label="Filtres" className="mb-8 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <Link key={label} href={k ? `/artisans?filtre=${k}` : "/artisans"} className={`pill ${filtre === k ? "border-white text-white" : "text-ash hover:text-white"}`}>{label}</Link>
        ))}
      </nav>
      {items.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map((c) => <ProductCard key={c.product.slug} item={c} />)}</div>
      ) : (
        <div className="card text-center">
          <p className="text-white">Les premiers artisans arrivent bientôt.</p>
          <p className="mt-2 text-sm text-ash">Vous fabriquez au Mali ? <Link href="/vendre" className="link">Ouvrez votre boutique gratuitement</Link> et cochez « Fabriqué au Mali » sur vos produits.</p>
        </div>
      )}
    </section>
  );
}

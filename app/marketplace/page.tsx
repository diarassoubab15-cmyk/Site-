import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogView } from "@/components/CatalogView";
import { listCards } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Marketplace : mode, beauté, électronique, épicerie",
  description: "Tous les produits des vendeurs vérifiés NEXORA. Paiement Orange Money, Wave, MTN MoMo, carte ou à la livraison.",
  alternates: { canonical: "/marketplace" },
};

export default async function Marketplace({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const items = await listCards({ q });
  return (
    <section className="container-x py-16">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Marketplace", href: "/marketplace" }]} />
      <h1 className="h-section">{q ? `Résultats pour « ${q} »` : "Marketplace"}</h1>
      <p className="mb-10 mt-4 text-ash">{items.length} produit{items.length > 1 ? "s" : ""} de vendeurs vérifiés.</p>
      <CatalogView items={items} q={q} />
    </section>
  );
}

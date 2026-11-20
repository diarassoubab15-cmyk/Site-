import Link from "next/link";
import { categories } from "@/lib/data";
import type { CardItem } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function CatalogView({ items, active, q }: { items: CardItem[]; active?: string; q?: string }) {
  return (
    <>
      {/* Recherche en GET : chaque résultat a une URL partageable */}
      <form action={active ? `/marketplace/${active}` : "/marketplace"} method="get" role="search" className="mb-6 flex gap-2">
        <label htmlFor="q" className="sr-only">Rechercher un produit</label>
        <input id="q" name="q" defaultValue={q} placeholder="Rechercher un produit, une boutique…" className="input max-w-md" />
        <button className="btn" type="submit">Rechercher</button>
      </form>
      <nav aria-label="Catégories" className="mb-10 flex flex-wrap gap-2">
        <Link href="/marketplace" className={`pill ${!active ? "border-white text-white" : "text-ash hover:text-white"}`}>Tout</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/marketplace/${c.slug}`} className={`pill ${active === c.slug ? "border-white text-white" : "text-ash hover:text-white"}`}>
            {c.name}
          </Link>
        ))}
      </nav>
      {items.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((c) => <ProductCard key={c.product.slug} item={c} />)}
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-white">Aucun produit ne correspond à « {q} ».</p>
          <p className="mt-2 text-sm text-ash">Essayez un autre mot, ou <Link href="/support" className="link">demandez au SAV</Link> : nous trouverons un vendeur.</p>
        </div>
      )}
    </>
  );
}

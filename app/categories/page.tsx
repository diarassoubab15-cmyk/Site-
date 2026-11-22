import type { Metadata } from "next";
import Link from "next/link";
import { ShopTypeIcon } from "@/components/ShopTypeIcon";
import { listCards, shopTypeCounts } from "@/lib/catalog";
import { ProductMarquee } from "@/components/ProductMarquee";
import type { Product } from "@/lib/data";
import { SHOP_TYPES } from "@/lib/shop-types";

export const metadata: Metadata = {
  title: "Catégories de boutiques",
  description: "Vêtements, technologie, immobilier, automobile, meubles, beauté, épicerie, vente en gros : toutes les boutiques vérifiées de NEXORA, par type.",
  alternates: { canonical: "/categories" },
};
export const revalidate = 120;

export default async function Categories() {
  const [counts, cards] = await Promise.all([shopTypeCounts(), listCards({ limit: 200 }).catch(() => [])]);
  const byType = new Map<string, Product[]>();
  for (const c of cards) { const l = byType.get(c.product.category) ?? []; if (l.length < 10) byType.set(c.product.category, [...l, c.product]); }
  return (
    <div className="cat-head">
      <section className="container-x pb-10 pt-16 sm:pt-24" aria-labelledby="cat-titre">
        <h1 id="cat-titre" className="h-display fade-up">Catégories</h1>
        <p className="fade-up mt-6 max-w-xl text-lg text-ash" style={{ ["--d" as string]: 1 }}>
          Choisissez un univers : ses boutiques vérifiées s&apos;affichent de A à Z.
        </p>
      </section>
      <section className="container-x pb-24" aria-label="Types de boutiques">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal suppressHydrationWarning>
          {SHOP_TYPES.map((t) => {
            const n = counts[t.slug] ?? 0;
            return (
              <li key={t.slug}>
                <Link
                  href={`/categories/${t.slug}`}
                  className="hub-tile h-full"
                  style={{ ["--c" as string]: t.color, ["--cl" as string]: t.light, minHeight: "13rem" }}
                  data-haptic
                  data-type={t.slug}
                >
                  <span className="hub-glow" aria-hidden="true" />
                  <ProductMarquee products={byType.get(t.slug) ?? []} type={t.slug} rows={1} className="marquee-sm" />
                  <span className="hub-icon h-16 w-16"><ShopTypeIcon slug={t.slug} /></span>
                  <span className="mt-auto block">
                    <span className="hub-title text-[1.75rem]">{t.name}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-ash">{t.tagline}</span>
                    <span className="mt-3 block font-mono text-xs" style={{ color: t.light }}>{n ? `${n} boutique${n > 1 ? "s" : ""}` : "Bientôt vos premières boutiques"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 text-sm text-ash">
          Vous cherchez un produit précis ? <Link href="/marketplace" className="link">Parcourez tous les produits</Link>.
        </p>
      </section>
    </div>
  );
}

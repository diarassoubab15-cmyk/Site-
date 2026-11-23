import Link from "next/link";
import { SpinLogo } from "@/components/SpinLogo";
import { HubTiles } from "@/components/HubTiles";
import { PaymentMethods } from "@/components/PaymentMethods";
import { onlineMethods } from "@/lib/payments";
import { ProductMarquee } from "@/components/ProductMarquee";
import { ShopTypeIcon } from "@/components/ShopTypeIcon";
import { listCards } from "@/lib/catalog";
import { SHOP_TYPES } from "@/lib/shop-types";

export const revalidate = 120;

/**
 * Accueil (thème clair, inspiré de Shop) : le logo NEXORA en motion design, une recherche en pilule,
 * les catégories en pastilles, puis les produits qui flottent en cartes blanches. Plus bas, les pages principales.
 */
export default async function Home() {
  const products = (await listCards({ limit: 24 }).catch(() => [])).map((c) => c.product);
  return (
    <>
      <section className="container-x flex flex-col items-center pb-10 pt-16 text-center sm:pt-20" aria-labelledby="accueil-titre">
        <SpinLogo size={200} />
        <p className="fade-up mt-14 text-lg font-semibold tracking-[0.32em] text-white" style={{ ["--d" as string]: 6 }} aria-hidden="true">NEXORA</p>
        <h1 id="accueil-titre" className="fade-up mt-4 max-w-xl font-display text-[2.1rem] leading-[1.1] text-white sm:text-5xl" style={{ ["--d" as string]: 7 }}>
          La marketplace africaine où chaque vendeur est vérifié.
        </h1>

        <form action="/marketplace" role="search" className="search-pill fade-up mt-9 w-full max-w-xl" style={{ ["--d" as string]: 8 }}>
          <label htmlFor="q" className="sr-only">Rechercher un produit</label>
          <input id="q" name="q" type="search" placeholder="Que cherchez-vous aujourd'hui ?" autoComplete="off" />
          <button type="submit" aria-label="Rechercher">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-4.5-5L15 10l-4.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
        <Link href="/trouver" className="ai-link fade-up mt-4" style={{ ["--d" as string]: 8 }} data-haptic>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" /></svg>
          Pas sûr du nom ? Décrivez ce que vous cherchez
        </Link>

        <nav aria-label="Catégories" className="cat-pills fade-up mt-6 flex w-full max-w-3xl gap-2 sm:flex-wrap sm:justify-center" style={{ ["--d" as string]: 9 }}>
          {SHOP_TYPES.map((t) => (
            <Link key={t.slug} href={`/categories/${t.slug}`} className="cat-pill" data-haptic>
              <span className="cat-pill-icon" style={{ color: t.color, background: `color-mix(in srgb, ${t.color} 14%, #fff)` }}><ShopTypeIcon slug={t.slug} size={18} /></span>
              {t.name}
            </Link>
          ))}
        </nav>
      </section>

      <section aria-label="Produits et boutiques à découvrir" className="pb-8">
        <ProductMarquee products={products} rows={2} />
      </section>

      <div className="flex justify-center pb-6">
        <a href="#pages" className="scroll-cue flex flex-col items-center gap-2 text-xs text-ash hover:text-white">
          Glissez vers le bas
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </div>

      <section id="pages" className="container-x scroll-mt-20 pb-28 pt-10" aria-label="Pages de NEXORA">
        <HubTiles />
      </section>

      <section aria-labelledby="paiements" className="border-t border-line bg-black/60">
        <div className="container-x flex flex-col items-start justify-between gap-5 py-12 md:flex-row md:items-center">
          <h2 id="paiements" className="text-sm text-ash">Paiement accepté partout : Mobile Money, carte ou à la livraison</h2>
          <PaymentMethods methods={[...onlineMethods, "cash_on_delivery"]} />
        </div>
      </section>
    </>
  );
}

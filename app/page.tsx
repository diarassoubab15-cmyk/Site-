import { SpinLogo } from "@/components/SpinLogo";
import { HubTiles } from "@/components/HubTiles";
import { PaymentMethods } from "@/components/PaymentMethods";
import { onlineMethods } from "@/lib/payments";
import { ProductMarquee } from "@/components/ProductMarquee";
import { listCards } from "@/lib/catalog";

export const revalidate = 120;

/**
 * Accueil : le logo NEXORA en plein écran (motion design, réagit au toucher),
 * puis, en glissant vers le bas, les pages principales encadrées chacune dans sa couleur.
 */
export default async function Home() {
  const products = (await listCards({ limit: 24 }).catch(() => [])).map((c) => c.product);
  return (
    <>
      <section className="container-x relative isolate flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center py-20 text-center" aria-labelledby="accueil-titre">
        <ProductMarquee products={products} rows={3} />
        <span className="hero-scrim" aria-hidden="true" />
        <SpinLogo size={240} />
        <p className="over-photo fade-up mt-16 text-lg font-semibold tracking-[0.32em] text-white" style={{ ["--d" as string]: 6 }} aria-hidden="true">NEXORA</p>
        <h1 id="accueil-titre" className="over-photo fade-up mt-5 max-w-md font-display text-3xl leading-snug text-white sm:text-[2.6rem]" style={{ ["--d" as string]: 7 }}>
          La marketplace africaine où chaque vendeur est vérifié.
        </h1>
        <a href="#pages" className="over-photo scroll-cue mt-16 flex flex-col items-center gap-2 text-xs text-bone hover:text-white">
          Glissez vers le bas
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </section>

      <section id="pages" className="container-x scroll-mt-20 pb-32 pt-16" aria-label="Pages de NEXORA">
        <HubTiles />
      </section>

      <section aria-labelledby="paiements" className="border-t border-line">
        <div className="container-x flex flex-col items-start justify-between gap-5 py-12 md:flex-row md:items-center">
          <h2 id="paiements" className="text-sm text-ash">Paiement accepté partout : Mobile Money, carte ou à la livraison</h2>
          <PaymentMethods methods={[...onlineMethods, "cash_on_delivery"]} />
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { SpinLogo } from "@/components/SpinLogo";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { JsonLd } from "@/components/JsonLd";
import { onlineMethods } from "@/lib/payments";
import { getHomeProof, listCards, shopTypeCounts } from "@/lib/catalog";
import { categoryPhotos } from "@/lib/category-photos";
import { SHOP_TYPES, getShopType } from "@/lib/shop-types";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 120;

/** Recherches fréquentes : un toucher suffit, utile quand on écrit peu sur téléphone. */
const POPULAR = ["Téléphone", "Bazin", "Karité", "Moto", "Wax", "Ordinateur"];

/**
 * Accueil « marché chaleureux » : on vient pour acheter ou vendre au Mali.
 * D'abord la recherche et ce qui rassure (paiement à la livraison, Mobile Money, vendeurs vérifiés),
 * puis les rayons en photos, les nouveautés avec leur prix, l'appel aux vendeurs,
 * et des preuves tirées des vraies données (boutiques vérifiées, derniers avis).
 */
export default async function Home() {
  const [cards, counts, proof] = await Promise.all([
    listCards({ limit: 500 }).catch(() => []),
    shopTypeCounts().catch(() => ({} as Record<string, number>)),
    getHomeProof().catch(() => ({ shops: [], reviews: [] })),
  ]);
  // Les plus récents d'abord (la liste arrive du plus ancien au plus récent).
  const latest = [...cards].reverse().slice(0, 8);

  return (
    <>
      {/* ---------- Haut de page : la recherche avant tout ---------- */}
      <section className="home-hero" aria-labelledby="accueil-titre">
        <div className="container-x grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <div className="flex items-center gap-3">
              <SpinLogo size={56} />
              <span className="text-sm font-medium text-bone">NEXORA · Mali</span>
            </div>
            <h1 id="accueil-titre" className="mt-6 max-w-xl text-balance font-display text-[2.4rem] leading-[1.04] text-white sm:text-6xl">
              Achetez et vendez au Mali, en toute confiance.
            </h1>
            <p className="mt-4 max-w-lg text-pretty text-[17px] text-bone">
              Des boutiques vérifiées, des prix en FCFA, et vous payez à la livraison ou par Mobile Money.
            </p>

            <form action="/marketplace" role="search" className="search-pill mt-7 w-full max-w-xl">
              <label htmlFor="q" className="sr-only">Rechercher un produit</label>
              <input id="q" name="q" type="search" placeholder="Que cherchez-vous aujourd'hui ?" autoComplete="off" />
              <button type="submit" aria-label="Rechercher">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-4.5-5L15 10l-4.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Recherches fréquentes">
              {POPULAR.map((q) => (
                <Link key={q} href={`/marketplace?q=${encodeURIComponent(q)}`} className="chip" data-haptic>{q}</Link>
              ))}
              <Link href="/trouver" className="ai-link" data-haptic>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" /></svg>
                Décrire ce que je cherche
              </Link>
            </div>

            <ul className="trust-row mt-8">
              <li>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="7" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.6" /></svg>
                <span><strong>Paiement à la livraison</strong> chez les vendeurs qui l&apos;acceptent</span>
              </li>
              <li>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="M10 18h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                <span><strong>Wave, Orange Money</strong>, Moov ou carte bancaire</span>
              </li>
              <li>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.8 19.5 6v5.5c0 4.6-3.1 8.4-7.5 9.7-4.4-1.3-7.5-5.1-7.5-9.7V6L12 2.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="m8.6 12 2.4 2.4 4.4-4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span><strong>Vendeurs vérifiés</strong> par l&apos;équipe NEXORA</span>
              </li>
            </ul>
          </div>

          {/* Photos du marché : décoratives, cachées sur téléphone pour aller vite */}
          <div className="hero-collage hidden lg:grid" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- photos déjà compressées (WebP) */}
            <img src="/fonds/mode-1.webp" alt="" width={600} height={760} fetchPriority="high" decoding="async" className="hc-a" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fonds/alimentation-1.webp" alt="" width={600} height={600} decoding="async" className="hc-b" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fonds/maison-2.webp" alt="" width={600} height={600} decoding="async" className="hc-c" />
          </div>
        </div>
      </section>

      {/* ---------- Rayons ---------- */}
      <section className="container-x pt-14" aria-labelledby="rayons">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="rayons" className="home-h2">Parcourir les rayons</h2>
          <Link href="/categories" className="text-sm font-medium text-iris hover:underline">Toutes les catégories</Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHOP_TYPES.map((t) => {
            const photo = categoryPhotos(t.slug)[0];
            const n = counts[t.slug] ?? 0;
            return (
              <li key={t.slug}>
                <Link href={`/categories/${t.slug}`} className="cat-tile" style={{ ["--c" as string]: t.color }} data-haptic>
                  {/* eslint-disable-next-line @next/next/no-img-element -- photos déjà compressées (WebP) */}
                  {photo && <img src={photo} alt="" width={400} height={300} loading="lazy" decoding="async" />}
                  <span className="cat-tile-text">
                    <span className="cat-tile-name">{t.name}</span>
                    {n > 0 && <span className="cat-tile-count">{n} boutique{n > 1 ? "s" : ""}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Nouveautés ---------- */}
      {latest.length > 0 && (
        <section className="container-x pt-16" aria-labelledby="nouveautes">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="nouveautes" className="home-h2">Nouveautés sur NEXORA</h2>
            <Link href="/marketplace" className="text-sm font-medium text-iris hover:underline">Voir tous les produits</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {latest.map((c) => <ProductCard key={c.product.slug} item={c} />)}
          </div>
        </section>
      )}

      {/* ---------- Vendeurs ---------- */}
      <section className="container-x pt-20" aria-labelledby="vendre-titre">
        <div className="seller-band">
          <div className="seller-band-text">
            <h2 id="vendre-titre" className="font-display text-[2.1rem] leading-[1.05] sm:text-5xl">Vous vendez ? Ouvrez votre boutique en quelques minutes.</h2>
            <ul className="seller-points">
              <li><strong>0 % de commission</strong> : vos clients vous paient directement.</li>
              <li><strong>Formule gratuite</strong> pour commencer, sans rien payer aujourd&apos;hui.</li>
              <li><strong>Vérifiée sous 24 à 48 h</strong> par l&apos;équipe NEXORA.</li>
              <li><strong>Commandes sur WhatsApp</strong>, paiement à la livraison et livreurs suivis.</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vendre" className="seller-cta" data-haptic>Créer ma boutique</Link>
              <Link href="/tarifs" className="seller-cta-ghost" data-haptic>Voir les tarifs</Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- photo déjà compressée (WebP) */}
          <img src="/fonds/maison-3.webp" alt="" width={640} height={640} loading="lazy" decoding="async" className="seller-band-img" />
        </div>
      </section>

      {/* ---------- Boutiques vérifiées ---------- */}
      {proof.shops.length > 0 && (
        <section className="container-x pt-20" aria-labelledby="boutiques">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="boutiques" className="home-h2">Boutiques vérifiées</h2>
            <Link href="/award" className="text-sm font-medium text-iris hover:underline">Palmarès du mois</Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proof.shops.map((s) => {
              const t = getShopType(s.category);
              return (
                <li key={s.slug}>
                  <Link href={`/boutiques/${s.slug}`} className="shop-row" data-haptic>
                    <span className="shop-mono" style={{ ["--c" as string]: t?.light ?? "#5433eb" }} aria-hidden="true">{s.name.trim().charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-white">{s.name}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 text-pulse" aria-label="vérifiée" role="img"><path d="M12 2.8 19.5 6v5.5c0 4.6-3.1 8.4-7.5 9.7-4.4-1.3-7.5-5.1-7.5-9.7V6L12 2.8Z" fill="currentColor" /><path d="m8.6 12 2.4 2.4 4.4-4.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                      </span>
                      <span className="block truncate text-sm text-ash">{t?.name ?? s.category} · {s.city}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-ash">
                        {s.reviews > 0 ? <><Stars value={s.average} size="text-xs" /> {s.average} ({s.reviews} avis)</> : "Nouvelle boutique"}
                        <span aria-hidden="true">·</span> {s.products} produit{s.products > 1 ? "s" : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ---------- Avis ---------- */}
      {proof.reviews.length > 0 && (
        <section className="container-x pt-20" aria-labelledby="avis">
          <h2 id="avis" className="home-h2">Ce que disent les acheteurs</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {proof.reviews.map((r) => (
              <li key={`${r.author}-${r.product.slug}`} className="review-card">
                <Stars value={r.rating} size="text-sm" />
                <blockquote className="mt-3 text-pretty text-[15px] leading-relaxed text-bone">« {r.body} »</blockquote>
                <p className="mt-4 text-sm text-white">{r.author}{r.city ? <span className="text-ash">, {r.city}</span> : null}</p>
                <Link href={`/produits/${r.product.slug}`} className="text-sm text-iris hover:underline">{r.product.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Paiement : fin de page qui rassure et relance ---------- */}
      <section className="container-x pt-20" aria-labelledby="paiements">
        <div className="pay-band">
          <div>
            <h2 id="paiements" className="home-h2">Payez comme vous voulez</h2>
            <p className="mt-2 max-w-md text-bone">Mobile Money, carte bancaire, ou en espèces à la livraison. Un problème avec une commande ? Le service client vous répond et peut vous rembourser.</p>
          </div>
          <div className="flex flex-col items-start gap-5">
            <PaymentMethods methods={[...onlineMethods, "cash_on_delivery"]} />
            <div className="flex flex-wrap gap-3">
              <Link href="/marketplace" className="btn-solid" data-haptic>Commencer mes achats</Link>
              <Link href="/support#remboursement" className="btn" data-haptic>Remboursements et SAV</Link>
            </div>
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Nouveautés sur NEXORA",
            itemListElement: latest.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/produits/${c.product.slug}`), name: c.product.name })),
          }}
        />
      )}
    </>
  );
}

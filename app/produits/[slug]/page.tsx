import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BuyBox } from "@/components/BuyBox";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { ProductThumb } from "@/components/ProductThumb";
import { ProductGallery } from "@/components/ProductGallery";
import { PanoTour } from "@/components/PanoTour";
import { SpinViewer } from "@/components/SpinViewer";
import { ReviewSection } from "@/components/ReviewSection";
import { Stars } from "@/components/Stars";
import { getCategory } from "@/lib/data";
import { allSlugs, getProductPage } from "@/lib/catalog";
import { formatDate, formatPrice, formatPriceUnit } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  return (await allSlugs()).products.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getProductPage((await params).slug);
  if (!page) return {};
  const { product: p, shop } = page;
  const description = `${p.short} ${formatPrice(p.price)} chez ${shop?.name}, vendeur vérifié. Paiement Mobile Money, carte ou à la livraison.`;
  return {
    title: `${p.name} · ${formatPrice(p.price)}`,
    description,
    alternates: { canonical: `/produits/${p.slug}` },
    openGraph: { type: "website", title: p.name, description, url: absoluteUrl(`/produits/${p.slug}`) },
  };
}

export default async function ProductPage({ params }: Props) {
  const page = await getProductPage((await params).slug);
  if (!page) notFound();
  const { product, shop, rating, reviews: list, related } = page;
  const cat = getCategory(product.category) ?? { slug: product.category, name: product.category };

  return (
    <section className="container-x py-16">
      {/* Une seule URL par produit (pas de doublon par catégorie) : meilleur référencement */}
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: cat.name, href: `/marketplace/${cat.slug}` }, { name: product.name, href: `/produits/${product.slug}` }]} />
      {/* Sur mobile : photo, puis prix et bouton, puis description. Sur grand écran : deux colonnes. */}
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:grid-rows-[auto_1fr]">
        <div className="pop lg:col-start-1 lg:row-start-1">{product.images?.length ? <ProductGallery product={product} /> : <ProductThumb product={product} large />}</div>
        <div className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-ash">{product.short}</p>
            {rating.count > 0 && (
              <a href="#avis" className="mt-3 flex items-center gap-2 text-sm text-ash hover:text-white">
                <Stars value={rating.average} /> {rating.average}/5 · {rating.count} avis vérifiés
              </a>
            )}
          </div>
          <Link href={`/boutiques/${shop.slug}`} className="flex items-center justify-between rounded-[16px] border border-line px-5 py-4 hover:border-iron">
            <span>
              <span className="block text-sm font-medium text-white">{shop.name} {shop.verified && <span className="text-pulse">✓</span>}</span>
              <span className="block text-xs text-ash">{shop.city}, {shop.country} · {shop.responseTime}</span>
            </span>
            <span className="text-iron" aria-hidden="true">›</span>
          </Link>
          {product.panos?.length ? <PanoTour panos={product.panos} title={product.name} /> : null}
          {(product.spin?.length ?? 0) >= 8 ? <SpinViewer frames={product.spin!} title={product.name} /> : null}
          {product.category === "immobilier" ? (
            <div className="card space-y-4">
              <p className="font-mono text-2xl text-white">{formatPriceUnit(product.price, product.priceUnit)}</p>
              <p className="text-sm text-ash">Intéressé ? Demandez une visite ou posez vos questions : votre message est transmis au vendeur par NEXORA.</p>
              <Link href={`/support?boutique=${shop.slug}#contact`} className="btn-solid w-full" data-haptic>Demander une visite</Link>
            </div>
          ) : (
            <BuyBox product={product} shop={shop} />
          )}
        </div>
        <div className="space-y-8 lg:col-start-1 lg:row-start-2">
          <div>
            <h2 className="mb-4 text-xl font-medium text-white">Description</h2>
            <p className="leading-relaxed text-bone">{product.description}</p>
          </div>
          <dl className="overflow-hidden rounded-[16px] border border-line">
            {product.specs.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr] border-b border-line px-5 py-3 text-sm last:border-0">
                <dt className="text-ash">{k}</dt>
                <dd className="text-bone">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section id="avis" className="mt-24 scroll-mt-24" aria-labelledby="avis-titre">
        <h2 id="avis-titre" className="h-section text-4xl sm:text-5xl">Avis clients</h2>
        <p className="mb-8 mt-3 text-ash">{rating.count ? `${rating.average}/5 sur ${rating.count} avis, tous issus d'achats vérifiés.` : "Pas encore d'avis."}</p>
        <div className="space-y-4" data-reveal suppressHydrationWarning>
          <ReviewSection product={product.slug} />
          {list.map((r) => (
            <article key={r.id} className="card p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Stars value={r.rating} />
                <h3 className="font-medium text-white">{r.title}</h3>
                {r.verified && <span className="badge text-pulse">achat vérifié</span>}
              </div>
              <p className="mt-3 text-bone">{r.body}</p>
              <p className="mt-3 text-xs text-iron">{r.author}, {r.city} · {formatDate(r.date)}</p>
              {r.sellerReply && (
                <p className="mt-4 border-l border-iris pl-4 text-sm text-ash"><span className="text-bone">Réponse du vendeur :</span> {r.sellerReply}</p>
              )}
            </article>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="similaires">
          <h2 id="similaires" className="mb-8 text-2xl font-medium text-white">Dans la même catégorie</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-reveal suppressHydrationWarning>{related.map((c) => <ProductCard key={c.product.slug} item={c} />)}</div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.slug,
          category: cat.name,
          url: absoluteUrl(`/produits/${product.slug}`),
          brand: { "@type": "Brand", name: shop.name },
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "XOF",
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: shop.name },
            url: absoluteUrl(`/produits/${product.slug}`),
          },
          ...(rating.count
            ? {
                aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count, bestRating: 5 },
                review: list.slice(0, 5).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.author }, datePublished: r.date, name: r.title, reviewBody: r.body, reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 } })),
              }
            : {}),
          isRelatedTo: { "@type": "WebSite", name: site.name },
        }}
      />
    </section>
  );
}

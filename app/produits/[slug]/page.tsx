import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BuyBox } from "@/components/BuyBox";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { ProductThumb } from "@/components/ProductThumb";
import { ReviewSection } from "@/components/ReviewSection";
import { Stars } from "@/components/Stars";
import { getCategory, getProduct, getShop, products, productsByCategory, ratingFor, reviewsFor } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const shop = getShop(p.shop);
  const description = `${p.short} ${formatPrice(p.price)} chez ${shop?.name}, vendeur vérifié. Paiement Mobile Money, carte ou à la livraison.`;
  return {
    title: `${p.name} · ${formatPrice(p.price)}`,
    description,
    alternates: { canonical: `/produits/${p.slug}` },
    openGraph: { type: "website", title: p.name, description, url: absoluteUrl(`/produits/${p.slug}`) },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const shop = getShop(product.shop)!;
  const cat = getCategory(product.category)!;
  const rating = ratingFor(product.slug);
  const list = reviewsFor(product.slug);
  const related = productsByCategory(product.category).filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <section className="container-x py-16">
      {/* Une seule URL par produit (pas de doublon par catégorie) : meilleur référencement */}
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: cat.name, href: `/marketplace/${cat.slug}` }, { name: product.name, href: `/produits/${product.slug}` }]} />
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-8">
          <ProductThumb product={product} large />
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
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
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
          <BuyBox product={product} shop={shop} />
        </div>
      </div>

      <section id="avis" className="mt-24 scroll-mt-24" aria-labelledby="avis-titre">
        <h2 id="avis-titre" className="h-section text-4xl sm:text-5xl">Avis clients</h2>
        <p className="mb-8 mt-3 text-ash">{rating.count ? `${rating.average}/5 sur ${rating.count} avis, tous issus d'achats vérifiés.` : "Pas encore d'avis."}</p>
        <div className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
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

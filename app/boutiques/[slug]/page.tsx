import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { allSlugs, getShopPage } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  return (await allSlugs()).shops.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getShopPage((await params).slug);
  if (!page) return {};
  const { shop } = page;
  return { title: `${shop.name}, boutique à ${shop.city}`, description: shop.description, alternates: { canonical: `/boutiques/${shop.slug}` } };
}

export default async function ShopPage({ params }: Props) {
  const page = await getShopPage((await params).slug);
  if (!page) notFound();
  const { shop, cards: items, rating } = page;
  return (
    <section className="container-x py-16">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Boutiques", href: "/marketplace" }, { name: shop.name, href: `/boutiques/${shop.slug}` }]} />
      <div className="card grid gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-medium tracking-tight text-white">{shop.name}</h1>
            {shop.verified && <span className="badge text-pulse">✓ vendeur vérifié</span>}
          </div>
          <p className="mt-2 text-sm text-ash">{shop.city}, {shop.country} · sur NEXORA depuis le {formatDate(shop.since)} · {shop.responseTime}</p>
          {rating.count > 0 && <p className="mt-3 flex items-center gap-2 text-sm text-ash"><Stars value={rating.average} /> {rating.average}/5 · {rating.count} avis vérifiés</p>}
          <p className="mt-5 max-w-2xl text-bone">{shop.description}</p>
          <div className="mt-6"><PaymentMethods methods={shop.payments} /></div>
        </div>
        <div className="flex flex-col gap-2 md:w-56">
          <Link href={`/support?boutique=${shop.slug}#contact`} className="btn">Contacter le vendeur</Link>
          <Link href={`/support?boutique=${shop.slug}#signaler`} className="btn-danger">Signaler cette boutique</Link>
        </div>
      </div>
      <h2 className="mb-8 mt-16 text-2xl font-medium text-white">Produits ({items.length})</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => <ProductCard key={c.product.slug} item={c} />)}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: shop.name,
          url: absoluteUrl(`/boutiques/${shop.slug}`),
          description: shop.description,
          address: { "@type": "PostalAddress", addressLocality: shop.city, addressCountry: shop.country },
          ...(rating.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count } } : {}),
        }}
      />
    </section>
  );
}

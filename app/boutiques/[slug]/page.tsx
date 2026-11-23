import type { Metadata } from "next";
import { ShopComments } from "@/components/ShopComments";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ShopMap } from "@/components/ShopMap";
import { getShopType } from "@/lib/shop-types";
import { mapsEmbedUrl, telLink } from "@/lib/maps";
import { WhatsAppOrder } from "@/components/WhatsAppOrder";
import { allSlugs, getShopCreations, getShopPage, getShopTier, resolveShopSlug } from "@/lib/catalog";
import { ShopHero } from "@/components/ShopHero";
import type { Signature } from "@/lib/shop-theme";
import { formatDate, formatPrice } from "@/lib/format";
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
  const slug = (await params).slug;
  const page = await getShopPage(slug);
  if (!page) {
    // Ancienne adresse d'une boutique qui a changé de lien : on envoie vers la nouvelle.
    const current = await resolveShopSlug(slug);
    if (current && current !== slug) permanentRedirect(`/boutiques/${current}`);
    notFound();
  }
  const { shop, cards: items, rating, awards, video } = page;
  const type = shop.category ? getShopType(shop.category) : undefined;
  const place = [shop.district, shop.city, shop.country].filter(Boolean).join(", ");
  // Boutique animée (Pro) et Vitrine Ultra : couleur de la marque, à défaut celle de son type de boutique.
  const tier = await getShopTier(shop.slug);
  const animated = tier === "pro" || tier === "business";
  const creations = tier === "business" ? await getShopCreations(shop.slug) : [];
  const brand = shop.brandColor ?? type?.color ?? "#5433eb";
  return (
    <section className="container-x py-16">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, type ? { name: type.name, href: `/categories/${type.slug}` } : { name: "Boutiques", href: "/categories" }, { name: shop.name, href: `/boutiques/${shop.slug}` }]} />
      {animated && (
        <ShopHero
          name={shop.name} tagline={shop.description || undefined} place={place} typeName={type?.name} color={brand} tier={tier!}
          signature={shop.signature as Signature | undefined} font={shop.displayFont} verified={shop.verified}
        />
      )}
      <div className={`card pop grid gap-8 md:grid-cols-[1fr_auto] ${animated ? "shop-brand-card" : ""}`} style={animated ? { ["--b" as string]: brand } : undefined}>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {animated ? <h2 className="text-xl font-medium text-white">La boutique</h2> : <h1 className="text-3xl font-medium tracking-tight text-white">{shop.name}</h1>}
            {shop.verified && <span className="badge text-pulse">✓ vendeur vérifié</span>}
          </div>
          {awards.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Distinctions">
              {awards.map((a) => <li key={a} className="badge border-amber/40 text-amber">🏆 {a}</li>)}
            </ul>
          )}
          <p className="mt-2 text-sm text-ash">{place} · sur NEXORA depuis le {formatDate(shop.since)} · {shop.responseTime}</p>
          {/* Sur téléphone, les boutons de contact viennent tout de suite (sur ordinateur : colonne de droite) */}
          {(shop.whatsapp || shop.callPhone) && (
            <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
              {shop.whatsapp && <WhatsAppOrder phone={shop.whatsapp} shopSlug={shop.slug} label="WhatsApp" className="btn-solid" text={`Bonjour ${shop.name}, je vous contacte depuis votre boutique NEXORA.`} />}
              {shop.callPhone && <a href={telLink(shop.callPhone)} className="btn" data-haptic>Appeler</a>}
            </div>
          )}
          {rating.count > 0 && <p className="mt-3 flex items-center gap-2 text-sm text-ash"><Stars value={rating.average} /> {rating.average}/5 · {rating.count} avis vérifiés</p>}
          <p className="mt-5 max-w-2xl text-bone">{shop.description}</p>
          {(shop.samplePrices?.length ?? 0) > 0 && (
            <ul className="mt-5 max-w-md space-y-1.5 text-sm" aria-label="Quelques prix">
              {shop.samplePrices!.map((s) => (
                <li key={s.name} className="flex justify-between gap-4 border-b border-line/60 pb-1.5"><span className="text-bone">{s.name}</span><span className="font-mono text-white">{formatPrice(s.price)}</span></li>
              ))}
            </ul>
          )}
          <div className="mt-6"><PaymentMethods methods={shop.payments} /></div>
          {shop.isPhysical && (
            <div className="mt-6">
              <p className="mb-3 text-sm text-ash">Boutique physique : vous pouvez venir sur place.</p>
              <ShopMap embed={mapsEmbedUrl(shop)} link={shop.mapsUrl} label={`${shop.name}, ${place}`} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 md:w-56">
          {shop.whatsapp && <WhatsAppOrder phone={shop.whatsapp} shopSlug={shop.slug} label="WhatsApp" className="btn-solid max-md:hidden" text={`Bonjour ${shop.name}, je vous contacte depuis votre boutique NEXORA.`} />}
          {shop.callPhone && <a href={telLink(shop.callPhone)} className="btn max-md:hidden" data-haptic>Appeler · <span className="font-mono">{shop.callPhone}</span></a>}
          <Link href={`/support?boutique=${shop.slug}#contact`} className="btn">Écrire via NEXORA</Link>
          <Link href={`/support?boutique=${shop.slug}#signaler`} className="btn-danger">Signaler cette boutique</Link>
        </div>
      </div>
      {video && (
        <section className="mt-10" aria-label="Vidéo de la boutique">
          <VideoPlayer src={video.src} poster={video.poster} label={`Présentation de ${shop.name}`} className="mx-auto max-w-4xl" />
        </section>
      )}
      {creations.length > 0 && (
        <section className="mt-12" aria-labelledby="galerie">
          <h2 id="galerie" className="mb-5 text-2xl font-medium text-white">Galerie</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4" data-reveal suppressHydrationWarning>
            {creations.map((c) => (
              <li key={c.id} className="shop-gallery-item">
                {c.kind === "video"
                  ? <video src={c.url} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover" aria-label={c.prompt} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={c.url} alt={c.prompt} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
              </li>
            ))}
          </ul>
        </section>
      )}
      <h2 className="mb-8 mt-16 text-2xl font-medium text-white">Produits ({items.length})</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" data-reveal suppressHydrationWarning>
        {items.map((c) => <ProductCard key={c.product.slug} item={c} />)}
      </div>
      <ShopComments slug={shop.slug} shopName={shop.name} />
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShopTypeIcon } from "@/components/ShopTypeIcon";
import { Stars } from "@/components/Stars";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getFeaturedShops, listCards, listShopsByType, type TypeShop } from "@/lib/catalog";
import { FeaturedShops } from "@/components/FeaturedShops";
import { ProductMarquee } from "@/components/ProductMarquee";
import { CarScene } from "@/components/CarScene";
import { SubcategoryNav } from "@/components/SubcategoryNav";
import { subcategoriesOf } from "@/lib/subcategories";
import { SHOP_TYPES, getShopType } from "@/lib/shop-types";
import { siteVideo } from "@/lib/site-videos";

export const revalidate = 120;
export const generateStaticParams = () => SHOP_TYPES.map((t) => ({ type: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const t = getShopType((await params).type);
  if (!t) return {};
  return { title: `${t.name} : boutiques vérifiées`, description: t.tagline, alternates: { canonical: `/categories/${t.slug}` } };
}

/** Initiale de rangement : « Élégance » va avec les E, « 3M » avec « 0-9 ». */
const initial = (name: string) => {
  const c = name.normalize("NFD").replace(/\p{M}/gu, "").trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "0-9";
};

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const t = getShopType((await params).type);
  if (!t) notFound();
  const [shops, featured, cards] = await Promise.all([listShopsByType(t.slug), getFeaturedShops(t.slug, 3), listCards({ category: t.slug, limit: 24 }).catch(() => [])]);
  const groups = new Map<string, TypeShop[]>();
  for (const s of shops) groups.set(initial(s.name), [...(groups.get(initial(s.name)) ?? []), s]);
  const video = siteVideo(t.slug);

  return (
    <div className="type-page" data-accent={t.color} style={{ ["--c" as string]: t.color, ["--cl" as string]: t.light }}>
      <section className="container-x pb-8 pt-8" aria-labelledby="type-titre">
        <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Catégories", href: "/categories" }, { name: t.name, href: `/categories/${t.slug}` }]} />
        <div className="type-hero mt-6 flex flex-wrap items-center gap-6">
          <span className="hub-icon h-24 w-24" style={{ color: t.light }}><ShopTypeIcon slug={t.slug} size={64} /></span>
          <div className="min-w-0">
            <h1 id="type-titre" className="h-display fade-up" style={{ color: t.light }}>{t.name}</h1>
            <p className="fade-up mt-4 max-w-xl text-lg text-ash" style={{ ["--d" as string]: 1 }}>{t.tagline}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/marketplace/${t.slug}`} className="btn">Voir tous les produits</Link>
          <Link href="/vendre" className="btn">Ouvrir une boutique {t.name.toLowerCase()}</Link>
        </div>
      </section>

      {subcategoriesOf(t.slug).length > 0 && (
        <section className="container-x pb-10" aria-labelledby="sous-titre">
          <h2 id="sous-titre" className="mb-4 text-xl font-medium text-white">Que cherchez-vous ?</h2>
          <SubcategoryNav category={t.slug} color={t.light} />
        </section>
      )}
      {t.slug === "automobile" && (
        <section className="container-x pb-10" aria-label="Voitures en mouvement">
          <CarScene color={t.color} />
          <p className="mt-3 text-sm text-ash">Sur chaque annonce : faites tourner la voiture du doigt et visitez l&apos;intérieur en 360°, comme dans un garage.</p>
        </section>
      )}
      {t.slug === "maison" && (
        <section className="container-x pb-10">
          <Link href="/amenager" className="room-cta" data-haptic>
            <span className="text-lg font-medium text-white">Aménagez votre maison</span>
            <span className="text-sm text-ash">Placez les meubles dans votre pièce, voyez le rendu, puis recevez un devis avec les meilleurs vendeurs.</span>
            <span className="btn-solid mt-2 self-start">Essayer maintenant</span>
          </Link>
        </section>
      )}

      <section aria-label={`Produits ${t.name.toLowerCase()} à découvrir`} className="pb-12">
        <ProductMarquee products={cards.map((c) => c.product)} type={t.slug} rows={1} />
      </section>

      {featured.length > 0 && (
        <div className="container-x pb-12">
          <FeaturedShops shops={featured} title="À la une" />
        </div>
      )}

      <section className="container-x pb-24" aria-labelledby="boutiques-az">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 id="boutiques-az" className="text-xl font-medium text-white">Boutiques de A à Z <span className="font-mono text-sm text-iron">({shops.length})</span></h2>
            {groups.size > 1 && (
              <nav aria-label="Aller à la lettre" className="mt-4 flex flex-wrap gap-1.5">
                {[...groups.keys()].map((l) => (
                  <a key={l} href={`#lettre-${l}`} className="pill px-2.5 py-1 text-xs" style={{ color: t.light }}>{l}</a>
                ))}
              </nav>
            )}
            {shops.length === 0 ? (
              <p className="mt-6 text-ash">Pas encore de boutique dans cette catégorie. <Link href="/vendre" className="link">Soyez la première</Link>.</p>
            ) : (
              <div className="mt-6 space-y-8">
                {[...groups.entries()].map(([letter, list]) => (
                  <section key={letter} id={`lettre-${letter}`} className="scroll-mt-24" aria-label={`Lettre ${letter}`}>
                    <p className="type-letter">{letter}</p>
                    <ul className="mt-3 space-y-2" data-reveal suppressHydrationWarning>
                      {list.map((s) => (
                        <li key={s.slug}>
                          <Link href={`/boutiques/${s.slug}`} className="type-row flex items-center gap-4 px-4 py-3.5" data-haptic>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-lg" style={{ borderColor: t.color, color: t.light }} aria-hidden="true">
                              {s.name.charAt(0)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-white">{s.name} {s.verified && <span className="text-pulse" title="Vérifiée par NEXORA">✓</span>}</span>
                              <span className="block truncate text-xs text-ash">{s.city}, {s.country} · {s.products} produit{s.products > 1 ? "s" : ""}</span>
                            </span>
                            {s.reviews > 0 && <span className="hidden items-center gap-1.5 text-xs text-bone sm:flex"><Stars value={s.average} /> {s.average}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
          {video && (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <VideoPlayer {...video} label={`Présentation : ${t.name}`} />
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}

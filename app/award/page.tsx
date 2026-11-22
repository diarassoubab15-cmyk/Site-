import type { Metadata } from "next";
import Link from "next/link";
import { ProductThumb } from "@/components/ProductThumb";
import { Stars } from "@/components/Stars";
import { getAwardPage, getFeaturedShops, type AwardWinner } from "@/lib/catalog";
import { FeaturedShops } from "@/components/FeaturedShops";
import { LogoMark } from "@/components/Logo";
import { formatPrice, formatPriceUnit } from "@/lib/format";

export const metadata: Metadata = {
  title: "Award : les meilleures boutiques et les meilleurs produits",
  description: "Le palmarès NEXORA : boutiques du mois, du semestre et de l'année, et les produits les mieux notés de chaque catégorie, d'après les avis d'achats vérifiés.",
  alternates: { canonical: "/award" },
};
export const revalidate = 300;

const KIND: Record<AwardWinner["kind"], string> = { month: "Boutique du mois", semester: "Boutique du semestre", year: "Boutique de l'année" };
const MEDAL = ["#e3b341", "#c9cdd3", "#c47f45"];   // or, argent, bronze

function Medal({ rank }: { rank: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs" style={{ borderColor: MEDAL[rank], color: MEDAL[rank] }}>
      <span aria-hidden="true">{rank + 1}</span><span className="sr-only">{rank === 0 ? "1er" : `${rank + 1}e`}</span>
    </span>
  );
}

export default async function Award() {
  const [{ winners, categories }, featured] = await Promise.all([getAwardPage(), getFeaturedShops(undefined, 6)]);
  return (
    <div className="award-page" data-accent="#e3b341">
      <section className="container-x flex flex-col items-center pb-16 pt-16 text-center sm:pt-24" aria-labelledby="award-titre">
        <span className="award-settle inline-flex"><LogoMark size={96} gid="nx-award" /></span>
        <h1 id="award-titre" className="award-title fade-up mt-8" style={{ ["--d" as string]: 2 }}>Award</h1>
        <p className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-[#d8cba6]" style={{ ["--d" as string]: 3 }}>
          Chaque mois, chaque semestre et chaque année, NEXORA récompense les boutiques que les clients préfèrent.
          Le classement ne repose que sur des avis d&apos;achats vérifiés.
        </p>
      </section>

      <section className="container-x pb-20" aria-labelledby="palmares">
        <h2 id="palmares" className="award-h2">Palmarès</h2>
        {winners.length === 0 ? (
          <p className="award-card mt-8 max-w-2xl text-[#d8cba6]">
            Les premiers lauréats seront annoncés à la fin du mois. La boutique gagnante reçoit des mois d&apos;abonnement offerts et un badge sur sa page.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal suppressHydrationWarning>
            {winners.map((w, i) => (
              <li key={`${w.shop.slug}-${i}`}>
                <Link href={`/boutiques/${w.shop.slug}`} className="award-card award-link flex h-full flex-col gap-4">
                  <span className="text-sm text-[#e3b341]">{KIND[w.kind]}</span>
                  <span className="font-display text-3xl leading-tight text-white">{w.shop.name}</span>
                  <span className="mt-auto text-sm text-[#a89a74]">{w.title}{w.shop.city ? ` · ${w.shop.city}` : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {featured.length > 0 && (
        <div className="container-x pb-20">
          <FeaturedShops shops={featured} title="À la une cette semaine" gold />
        </div>
      )}

      <section className="container-x pb-24" aria-labelledby="meilleurs">
        <h2 id="meilleurs" className="award-h2">Les mieux notés, catégorie par catégorie</h2>
        {categories.length === 0 && <p className="mt-6 text-[#a89a74]">Pas encore assez d&apos;avis pour établir un classement.</p>}
        <div className="mt-10 space-y-12">
          {categories.map((cat) => (
            <article key={cat.slug} className="award-row" aria-labelledby={`aw-${cat.slug}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 id={`aw-${cat.slug}`} className="font-display text-3xl text-white">{cat.name}</h3>
                <Link href={`/marketplace/${cat.slug}`} className="text-sm text-[#e3b341] hover:underline">Tout le rayon</Link>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
                <div>
                  <p className="mb-3 text-sm text-[#a89a74]">Boutiques</p>
                  <ol className="space-y-2">
                    {cat.shops.map((s, i) => (
                      <li key={s.slug}>
                        <Link href={`/boutiques/${s.slug}`} className="award-link flex items-center gap-3 rounded-[12px] border border-[#3a2d10] px-3 py-2.5">
                          <Medal rank={i} />
                          <span className="min-w-0 flex-1 truncate text-white">{s.name}</span>
                          <span className="flex items-center gap-1.5 text-xs text-[#d8cba6]"><Stars value={s.average} /> {s.average}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="mb-3 text-sm text-[#a89a74]">Produits</p>
                  <ol className="grid gap-3 sm:grid-cols-3">
                    {cat.products.map((c, i) => (
                      <li key={c.product.slug}>
                        <Link href={`/produits/${c.product.slug}`} className="award-link block rounded-[14px] border border-[#3a2d10] p-2.5">
                          <div className="relative">
                            <ProductThumb product={c.product} />
                            <span className="absolute left-2 top-2"><Medal rank={i} /></span>
                          </div>
                          <p className="mt-3 truncate text-sm text-white">{c.product.name}</p>
                          <p className="mt-1 flex items-center justify-between gap-2 text-xs text-[#d8cba6]">
                            <span className="font-mono">{c.product.priceUnit ? formatPriceUnit(c.product.price, c.product.priceUnit) : formatPrice(c.product.price)}</span>
                            <span>★ {c.rating.average} ({c.rating.count})</span>
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

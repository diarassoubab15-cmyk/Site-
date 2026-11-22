import Link from "next/link";
import type { FeaturedShop } from "@/lib/catalog";
import { getShopType } from "@/lib/shop-types";

/**
 * « À la une » : boutiques Ultra mises en avant, renouvelées chaque lundi.
 * Toujours signalées comme mise en avant (forfait Ultra) : jamais confondues avec le palmarès Award,
 * qui ne dépend que des avis vérifiés.
 */
export function FeaturedShops({ shops, title, gold = false }: { shops: FeaturedShop[]; title: string; gold?: boolean }) {
  if (!shops.length) return null;
  return (
    <section aria-labelledby="a-la-une" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="a-la-une" className={gold ? "award-h2" : "text-xl font-medium text-white"}>{title}</h2>
        <p className={`text-xs ${gold ? "text-[#a89a74]" : "text-ash"}`}>Mise en avant des boutiques Ultra, renouvelée chaque lundi</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-reveal suppressHydrationWarning>
        {shops.map((s) => {
          const t = getShopType(s.category);
          const c = s.brandColor ?? t?.color ?? "#5433eb";
          return (
            <li key={s.slug}>
              <Link href={`/boutiques/${s.slug}`} className="featured-card" style={{ ["--b" as string]: c }} data-featured={s.slug}>
                <span className="featured-shine" aria-hidden="true" />
                <span className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border font-display text-xl" style={{ borderColor: c, color: c }} aria-hidden="true">
                    {s.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-2xl leading-tight text-white">{s.name}</span>
                    <span className="block truncate text-xs text-ash">{t?.name ?? s.category} · {s.city}, {s.country}</span>
                  </span>
                </span>
                <span className="featured-badge">Mise en avant · Ultra</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

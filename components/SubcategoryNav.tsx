import Link from "next/link";
import { subcategoriesOf } from "@/lib/subcategories";

/** Petites parties d'une catégorie (Technologie : ordinateurs, télévisions, PlayStation…), en tuiles cliquables. */
export function SubcategoryNav({ category, active, counts, color = "#5433eb" }: { category: string; active?: string; counts?: Record<string, number>; color?: string }) {
  const subs = subcategoriesOf(category);
  if (!subs.length) return null;
  return (
    <nav aria-label="Sous-catégories" className="sub-grid">
      <Link href={`/marketplace/${category}`} className={`sub-tile ${!active ? "is-on" : ""}`} style={{ ["--c" as string]: color }} aria-current={!active ? "page" : undefined}>
        <span className="sub-icon" aria-hidden="true">✦</span>
        <span>Tout voir</span>
      </Link>
      {subs.map((s) => (
        <Link key={s.slug} href={`/marketplace/${category}?sous=${s.slug}`} className={`sub-tile ${active === s.slug ? "is-on" : ""}`} style={{ ["--c" as string]: color }}
          aria-current={active === s.slug ? "page" : undefined} data-haptic>
          <span className="sub-icon" aria-hidden="true">{s.icon}</span>
          <span>{s.name}</span>
          {counts && <span className="font-mono text-[11px] text-iron">{counts[s.slug] ?? 0}</span>}
        </Link>
      ))}
    </nav>
  );
}

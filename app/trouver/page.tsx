import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { categories } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { findProducts, MAX_REQUEST } from "@/lib/shopping-assistant";

export const metadata: Metadata = {
  title: "Assistant d'achat : décrivez ce que vous cherchez",
  description: "Écrivez avec vos mots ce que vous voulez acheter : l'assistant NEXORA trouve les produits des vendeurs vérifiés qui correspondent, dans votre budget.",
  alternates: { canonical: "/trouver" },
};

const examples = [
  "Une robe en wax pour un mariage, moins de 30 000 F",
  "Un téléphone Samsung pas cher pour ma mère",
  "Du beurre de karité naturel pour les cheveux",
  "Un appartement 2 chambres à louer à Bamako",
  "Des cartons de savon pour revendre",
];

function Sparkle({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" />
      <path d="M19 15.5c.25 1.9 1.1 2.75 3 3-1.9.25-2.75 1.1-3 3-.25-1.9-1.1-2.75-3-3 1.9-.25 2.75-1.1 3-3Z" fill="currentColor" opacity=".6" />
    </svg>
  );
}

export default async function Trouver({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d = "" } = await searchParams;
  const ask = d.replace(/\s+/g, " ").trim().slice(0, MAX_REQUEST);
  const result = ask ? await findProducts(ask) : null;
  const u = result?.understood;
  const chips = u
    ? [
        u.category && categories.find((c) => c.slug === u.category)?.name,
        u.maxPrice !== null && u.minPrice !== null ? `${formatPrice(u.minPrice)} à ${formatPrice(u.maxPrice)}` : u.maxPrice !== null ? `${formatPrice(u.maxPrice)} maximum` : u.minPrice !== null ? `À partir de ${formatPrice(u.minPrice)}` : null,
        u.city && `À ${u.city}`,
        ...u.keywords.slice(0, 5).map((k) => `« ${k} »`),
      ].filter(Boolean) as string[]
    : [];

  return (
    <section className="container-x py-16">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Assistant d'achat", href: "/trouver" }]} />
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow inline-flex items-center gap-2 text-iris"><Sparkle size={14} /> Assistant d&apos;achat</p>
        <h1 className="h-section mt-4 text-4xl sm:text-5xl">Dites-nous ce que vous cherchez</h1>
        <p className="mt-4 text-ash">Écrivez comme vous parlez : le produit, votre budget, votre ville. Nous trouvons pour vous chez les vendeurs vérifiés.</p>

        <form action="/trouver" method="get" className="ai-ask mt-8 text-left">
          <label htmlFor="d" className="sr-only">Décrivez ce que vous cherchez</label>
          <textarea id="d" name="d" rows={3} maxLength={MAX_REQUEST} defaultValue={ask} required
            placeholder="Ex. : je cherche des chaussures pour homme, taille 43, moins de 20 000 F, livrées à Bamako" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-iron">{MAX_REQUEST} caractères au plus</span>
            <button type="submit" className="btn-solid gap-2" data-haptic><Sparkle size={16} /> Trouver</button>
          </div>
        </form>

        {!ask && (
          <div className="mt-6">
            <p className="text-sm text-ash">Pas d&apos;idée ? Essayez :</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {examples.map((e) => (
                <li key={e}><Link href={`/trouver?d=${encodeURIComponent(e)}`} className="cat-pill px-4 text-sm">{e}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-12" aria-live="polite">
          <div className="card mb-8">
            <p className="text-sm text-ash">Ce que nous avons compris</p>
            {u?.summary && <p className="mt-2 text-white">{u.summary}</p>}
            {chips.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {chips.map((c) => <li key={c} className="rounded-full bg-lift px-3 py-1 text-sm text-bone">{c}</li>)}
              </ul>
            )}
            {result.note && <p className="mt-4 rounded-[14px] bg-[#fff6e5] px-3 py-2 text-sm text-[#8a5a00]">{result.note}</p>}
          </div>

          {result.items.length ? (
            <>
              <h2 className="mb-6 text-xl font-medium text-white">
                {result.exact ? `${result.items.length} produit${result.items.length > 1 ? "s" : ""} pour vous` : "Ce qui s'en rapproche le plus"}
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {result.items.map((c) => <ProductCard key={c.product.slug} item={c} />)}
              </div>
            </>
          ) : (
            <div className="card text-center">
              <p className="text-white">Nous n&apos;avons pas encore ce produit.</p>
              <p className="mt-2 text-sm text-ash">
                De nouveaux vendeurs arrivent chaque semaine. Écrivez autrement votre demande, parcourez les{" "}
                <Link href="/categories" className="link">catégories</Link>, ou <Link href="/support" className="link">demandez au service client</Link> : nous trouverons un vendeur pour vous.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

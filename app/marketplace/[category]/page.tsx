import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogView } from "@/components/CatalogView";
import { categories, getCategory } from "@/lib/data";
import { listCards } from "@/lib/catalog";
import { VideoPlayer } from "@/components/VideoPlayer";
import { siteVideo } from "@/lib/site-videos";
import { SubcategoryNav } from "@/components/SubcategoryNav";
import { getSubcategory, subcategoryOf } from "@/lib/subcategories";
import { getShopType } from "@/lib/shop-types";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string; sous?: string }> };

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategory((await params).category);
  if (!cat) return {};
  return { title: `${cat.name} : achat en ligne`, description: `${cat.description} Vendeurs vérifiés, paiement Mobile Money ou à la livraison.`, alternates: { canonical: `/marketplace/${cat.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = getCategory((await params).category);
  if (!cat) notFound();
  const { q = "", sous } = await searchParams;
  const sub = getSubcategory(cat.slug, sous);
  const all = await listCards({ q, category: cat.slug });
  const items = sub ? all.filter((c) => subcategoryOf(c.product) === sub.slug) : all;
  const counts: Record<string, number> = {};
  for (const c of all) { const k = subcategoryOf(c.product); if (k) counts[k] = (counts[k] ?? 0) + 1; }
  return (
    <section className="container-x py-16">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Marketplace", href: "/marketplace" }, { name: cat.name, href: `/marketplace/${cat.slug}` }, ...(sub ? [{ name: sub.name, href: `/marketplace/${cat.slug}?sous=${sub.slug}` }] : [])]} />
      <div className="mb-10 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h1 className="h-section">{sub ? `${sub.icon} ${sub.name}` : cat.name}</h1>
          <p className="mt-4 max-w-2xl text-ash">{cat.description}</p>
        </div>
        {siteVideo(cat.slug) && <VideoPlayer {...siteVideo(cat.slug)!} label={`Présentation : ${cat.name}`} />}
      </div>
      <div className="mb-10"><SubcategoryNav category={cat.slug} active={sub?.slug} counts={counts} color={getShopType(cat.slug)?.light} /></div>
      <CatalogView items={items} active={cat.slug} q={q} />
    </section>
  );
}

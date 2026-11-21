import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatalogView } from "@/components/CatalogView";
import { categories, getCategory } from "@/lib/data";
import { listCards } from "@/lib/catalog";
import { VideoPlayer } from "@/components/VideoPlayer";
import { siteVideo } from "@/lib/site-videos";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ q?: string }> };

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
  const { q = "" } = await searchParams;
  const items = await listCards({ q, category: cat.slug });
  return (
    <section className="container-x py-16">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Marketplace", href: "/marketplace" }, { name: cat.name, href: `/marketplace/${cat.slug}` }]} />
      <div className="mb-10 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h1 className="h-section">{cat.name}</h1>
          <p className="mt-4 max-w-2xl text-ash">{cat.description}</p>
        </div>
        {siteVideo(cat.slug) && <VideoPlayer {...siteVideo(cat.slug)!} label={`Présentation : ${cat.name}`} />}
      </div>
      <CatalogView items={items} active={cat.slug} q={q} />
    </section>
  );
}

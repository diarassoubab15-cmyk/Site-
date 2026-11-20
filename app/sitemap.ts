import type { MetadataRoute } from "next";
import { categories } from "@/lib/data";
import { allSlugs } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, shops } = await allSlugs();
  const now = new Date();
  const statics = ["/", "/marketplace", "/vendre", "/tarifs", "/securite", "/support", "/confidentialite", "/conditions"];
  return [
    ...statics.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/marketplace/${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((slug) => ({ url: absoluteUrl(`/produits/${slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...shops.map((slug) => ({ url: absoluteUrl(`/boutiques/${slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}

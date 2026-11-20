import type { MetadataRoute } from "next";
import { categories, products, shops } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const statics = ["/", "/marketplace", "/vendre", "/tarifs", "/securite", "/support", "/confidentialite", "/conditions"];
  return [
    ...statics.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/marketplace/${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: absoluteUrl(`/produits/${p.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...shops.map((s) => ({ url: absoluteUrl(`/boutiques/${s.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}

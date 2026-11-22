import { NextResponse } from "next/server";
import { resolveShopSlug } from "@/lib/catalog";

/**
 * Lien court d'une boutique, à partager : /b/<adresse> → /boutiques/<adresse>.
 * Une ancienne adresse (le vendeur a changé de lien) mène à la nouvelle.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug.toLowerCase().slice(0, 80);
  const current = (await resolveShopSlug(slug)) ?? slug;
  return NextResponse.redirect(new URL(`/boutiques/${encodeURIComponent(current)}`, req.url), 308);
}

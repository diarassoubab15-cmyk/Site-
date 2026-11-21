import "server-only";
/**
 * Lecture du catalogue : Supabase si configuré, sinon données de démo (lib/data.ts).
 * Les pages n'appellent que ces fonctions.
 */
import * as demo from "./data";
import type { Product, Review, Shop } from "./data";
import type { PaymentMethodId } from "./payments";
import { supabaseEnabled } from "./supabase/env";
import { supabasePublic } from "./supabase/server";
import { storageUrl } from "./site-videos";

export type Rating = { average: number; count: number };
export type CardItem = { product: Product; shop: Pick<Shop, "slug" | "name" | "verified" | "acceptsCashOnDelivery">; rating: Rating };

const rate = (list: { rating: number }[]): Rating =>
  list.length ? { average: Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10, count: list.length } : { average: 0, count: 0 };

// ------------------------------------------------------------------ correspondance base → affichage
type ShopRow = { slug: string; name: string; city: string; country: string; description: string | null; created_at: string; accepts_cod: boolean; response_time: string; payments: string[] };
type ProductRow = {
  id: string; slug: string; name: string; short: string | null; description: string | null; category: string; price: number;
  compare_at: number | null; stock: number; wholesale_min: number | null; wholesale_price: number | null; specs: unknown; glyph: string; tone: string;
  price_unit: string | null; product_media?: { path: string; kind: string; position: number; label: string | null; status: string }[];
  shops: ShopRow;
};

const toShop = (s: ShopRow): Shop => ({
  slug: s.slug,
  name: s.name,
  city: s.city,
  country: s.country,
  description: s.description ?? "",
  since: s.created_at.slice(0, 10),
  verified: true, // seules les boutiques autorisées sont lisibles (RLS)
  responseTime: s.response_time,
  acceptsCashOnDelivery: s.accepts_cod,
  payments: [...(s.payments as PaymentMethodId[]), ...(s.accepts_cod ? (["cash_on_delivery"] as PaymentMethodId[]) : [])],
});

const toProduct = (p: ProductRow): Product => ({
  slug: p.slug,
  name: p.name,
  shop: p.shops.slug,
  category: p.category,
  price: p.price,
  compareAt: p.compare_at ?? undefined,
  stock: p.stock,
  wholesale: p.wholesale_min && p.wholesale_price ? { minQty: p.wholesale_min, price: p.wholesale_price } : undefined,
  short: p.short ?? "",
  description: p.description ?? "",
  specs: Array.isArray(p.specs) ? (p.specs as [string, string][]) : [],
  glyph: p.glyph,
  tone: p.tone,
  priceUnit: (p.price_unit as Product["priceUnit"]) ?? undefined,
  images: media(p, "photo").map((m) => mediaUrl(m.path)),
  panos: media(p, "pano").map((m) => ({ url: mediaUrl(m.path), label: m.label ?? "Pièce" })),
});

const media = (p: ProductRow, kind: string) =>
  (p.product_media ?? []).filter((m) => m.kind === kind && m.status === "approved").sort((a, b) => a.position - b.position);
/** Adresse publique d'un fichier du stockage « product-media ». */
export const mediaUrl = (path: string) => `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/product-media/${path}`;

const PRODUCT_COLS = "id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone, price_unit, product_media(path, kind, position, label, status), shops!inner(slug, name, city, country, description, created_at, accepts_cod, response_time, payments)";

async function ratingsFor(ids: string[]) {
  if (!ids.length) return new Map<string, Rating>();
  const { data } = await supabasePublic().from("reviews").select("product_id, rating").in("product_id", ids);
  const by = new Map<string, { rating: number }[]>();
  (data ?? []).forEach((r) => by.set(r.product_id, [...(by.get(r.product_id) ?? []), r]));
  return new Map(ids.map((id) => [id, rate(by.get(id) ?? [])]));
}

async function toCards(rows: ProductRow[]): Promise<CardItem[]> {
  const ratings = await ratingsFor(rows.map((r) => r.id));
  return rows.map((r) => {
    const shop = toShop(r.shops);
    return { product: toProduct(r), shop, rating: ratings.get(r.id)! };
  });
}

const demoCard = (p: Product): CardItem => ({ product: p, shop: demo.getShop(p.shop)!, rating: demo.ratingFor(p.slug) });

// Nettoie la recherche pour le filtre PostgREST (pas de virgule, parenthèse ni joker).
const clean = (q: string) => q.replace(/[,()%*\\:."']/g, " ").trim().slice(0, 60);

// ------------------------------------------------------------------ API
export async function listCards(opts: { q?: string; category?: string; limit?: number; inStock?: boolean } = {}): Promise<CardItem[]> {
  if (!supabaseEnabled) {
    let list = demo.searchProducts(opts.q ?? "", opts.category);
    if (opts.inStock) list = list.filter((p) => p.stock > 0);
    return list.slice(0, opts.limit ?? 500).map(demoCard);
  }
  let query = supabasePublic().from("products").select(PRODUCT_COLS).eq("published", true).order("created_at", { ascending: true }).limit(opts.limit ?? 500);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.inStock) query = query.gt("stock", 0);
  const q = clean(opts.q ?? "");
  if (q) query = query.or(`name.ilike.%${q}%,short.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return toCards((data ?? []) as unknown as ProductRow[]);
}

export async function getProductPage(slug: string) {
  if (!supabaseEnabled) {
    const product = demo.getProduct(slug);
    if (!product) return null;
    return {
      product,
      shop: demo.getShop(product.shop)!,
      reviews: demo.reviewsFor(slug),
      rating: demo.ratingFor(slug),
      related: demo.productsByCategory(product.category).filter((p) => p.slug !== slug).slice(0, 4).map(demoCard),
    };
  }
  const sb = supabasePublic();
  const { data } = await sb.from("products").select(PRODUCT_COLS).eq("slug", slug).eq("published", true).maybeSingle();
  if (!data) return null;
  const row = data as unknown as ProductRow;
  const { data: rv } = await sb.from("reviews").select("id, rating, title, body, created_at, seller_reply, author_name, author_city").eq("product_id", row.id).order("created_at", { ascending: false });
  const reviews: Review[] = (rv ?? []).map((r) => ({
    id: r.id, product: slug, author: r.author_name ?? "Client", city: r.author_city ?? "", rating: r.rating as Review["rating"],
    title: r.title, body: r.body, date: r.created_at.slice(0, 10), verified: true, sellerReply: r.seller_reply ?? undefined,
  }));
  const related = (await listCards({ category: row.category, limit: 5 })).filter((c) => c.product.slug !== slug).slice(0, 4);
  return { product: toProduct(row), shop: toShop(row.shops), reviews, rating: rate(reviews), related };
}

export async function getShopPage(slug: string) {
  if (!supabaseEnabled) {
    const shop = demo.getShop(slug);
    if (!shop) return null;
    return { shop, cards: demo.productsByShop(slug).map(demoCard), rating: demo.shopRating(slug), awards: [] as string[], video: null as { src: string; poster: string } | null };
  }
  const sb = supabasePublic();
  const { data: s } = await sb.from("shops").select("id, slug, name, city, country, description, created_at, accepts_cod, response_time, payments").eq("slug", slug).eq("status", "approved").maybeSingle();
  if (!s) return null;
  const { data } = await sb.from("products").select(PRODUCT_COLS).eq("shop_id", s.id).eq("published", true);
  const cards = await toCards((data ?? []) as unknown as ProductRow[]);
  const all = cards.filter((c) => c.rating.count);
  const count = all.reduce((n, c) => n + c.rating.count, 0);
  const average = count ? Math.round((all.reduce((n, c) => n + c.rating.average * c.rating.count, 0) / count) * 10) / 10 : 0;
  const { data: vid } = await sb.from("shop_videos").select("video_path, poster_path").eq("shop_id", s.id).eq("status", "approved").eq("is_active", true).maybeSingle();
  const video = vid?.video_path && vid.poster_path ? { src: storageUrl(vid.video_path), poster: storageUrl(vid.poster_path) } : null;
  const { data: aw } = await sb.from("rewards").select("title").eq("shop_id", s.id).is("revoked_at", null).neq("kind", "gift").order("created_at", { ascending: false }).limit(5);
  return { shop: toShop(s as ShopRow), cards, rating: { average, count }, awards: (aw ?? []).map((a) => a.title), video };
}

export async function allSlugs() {
  if (!supabaseEnabled) return { products: demo.products.map((p) => p.slug), shops: demo.shops.map((s) => s.slug) };
  try {
    const sb = supabasePublic();
    const [{ data: p }, { data: s }] = await Promise.all([
      sb.from("products").select("slug").eq("published", true),
      sb.from("shops").select("slug").eq("status", "approved"),
    ]);
    return { products: (p ?? []).map((x) => x.slug), shops: (s ?? []).map((x) => x.slug) };
  } catch {
    return { products: [], shops: [] }; // base injoignable au build : pages générées à la demande
  }
}

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
type ShopRow = {
  slug: string; name: string; city: string; country: string; description: string | null; created_at: string; accepts_cod: boolean; response_time: string; payments: string[];
  district?: string | null; is_physical?: boolean; maps_url?: string | null; lat?: number | null; lng?: number | null;
  whatsapp?: string | null; call_phone?: string | null; sample_prices?: unknown; category?: string;
};
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
  category: s.category,
  district: s.district ?? undefined,
  isPhysical: s.is_physical ?? false,
  mapsUrl: s.maps_url ?? undefined,
  lat: s.lat != null ? Number(s.lat) : undefined,
  lng: s.lng != null ? Number(s.lng) : undefined,
  whatsapp: s.whatsapp ?? undefined,
  callPhone: s.call_phone ?? undefined,
  samplePrices: Array.isArray(s.sample_prices) ? (s.sample_prices as { name: string; price: number }[]) : [],
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
  spin: media(p, "spin").map((m) => mediaUrl(m.path)),
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
  const { data: s } = await sb.from("shops").select("id, slug, name, city, country, description, created_at, accepts_cod, response_time, payments, category, district, is_physical, maps_url, lat, lng, whatsapp, call_phone, sample_prices").eq("slug", slug).eq("status", "approved").maybeSingle();
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

// ------------------------------------------------------------------ Award
export type AwardWinner = { title: string; kind: "month" | "semester" | "year"; shop: { slug: string; name: string; city: string } };
export type AwardCategory = {
  slug: string;
  name: string;
  shops: { slug: string; name: string; average: number; count: number }[];
  products: CardItem[];
};

/** Palmarès (récompenses publiques) et, par catégorie, les 3 boutiques et les 3 produits les mieux notés (avis vérifiés). */
export async function getAwardPage(): Promise<{ winners: AwardWinner[]; categories: AwardCategory[] }> {
  const cards = await listCards({ limit: 500 });
  const rated = cards.filter((c) => c.rating.count > 0);
  const score = (avg: number, n: number) => (avg * n + 4 * 2) / (n + 2);   // moyenne lissée : 1 seul avis 5/5 ne passe pas devant 20 avis à 4,8
  const categories: AwardCategory[] = demo.categories
    .map((cat) => {
      const inCat = rated.filter((c) => c.product.category === cat.slug);
      const byShop = new Map<string, { slug: string; name: string; sum: number; count: number }>();
      for (const c of inCat) {
        const s = byShop.get(c.shop.slug) ?? { slug: c.shop.slug, name: c.shop.name, sum: 0, count: 0 };
        s.sum += c.rating.average * c.rating.count;
        s.count += c.rating.count;
        byShop.set(c.shop.slug, s);
      }
      const shops = [...byShop.values()]
        .map((s) => ({ slug: s.slug, name: s.name, average: Math.round((s.sum / s.count) * 10) / 10, count: s.count }))
        .sort((a, b) => score(b.average, b.count) - score(a.average, a.count))
        .slice(0, 3);
      const products = [...inCat].sort((a, b) => score(b.rating.average, b.rating.count) - score(a.rating.average, a.rating.count)).slice(0, 3);
      return { slug: cat.slug, name: cat.name, shops, products };
    })
    .filter((c) => c.products.length);

  if (!supabaseEnabled) return { winners: [], categories };
  const { data } = await supabasePublic()
    .from("rewards")
    .select("title, kind, shops(slug, name, city)")
    .is("revoked_at", null)
    .neq("kind", "gift")
    .order("created_at", { ascending: false })
    .limit(24);
  const winners = (data ?? [])
    .filter((r) => r.shops)
    .map((r) => ({ title: r.title, kind: r.kind as AwardWinner["kind"], shop: r.shops as unknown as AwardWinner["shop"] }));
  return { winners, categories };
}

// ------------------------------------------------------------------ types de boutiques
export type TypeShop = { slug: string; name: string; city: string; country: string; verified: boolean; average: number; reviews: number; products: number };

/** En démonstration, le type d'une boutique est la catégorie de ses produits. */
const demoShopType = (slug: string) => demo.products.find((p) => p.shop === slug)?.category;

/** Nombre de boutiques en ligne par type. */
export async function shopTypeCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (!supabaseEnabled) {
    for (const s of demo.shops) { const t = demoShopType(s.slug); if (t) counts[t] = (counts[t] ?? 0) + 1; }
    return counts;
  }
  const { data } = await supabasePublic().from("shops").select("category").eq("status", "approved");
  for (const s of data ?? []) counts[s.category] = (counts[s.category] ?? 0) + 1;
  return counts;
}

/** Boutiques d'un type, par ordre alphabétique (ordre français : accents et majuscules confondus). */
export async function listShopsByType(type: string): Promise<TypeShop[]> {
  const cards = await listCards({ category: type });
  const stats = new Map<string, { sum: number; count: number; products: number }>();
  for (const c of cards) {
    const s = stats.get(c.shop.slug) ?? { sum: 0, count: 0, products: 0 };
    s.sum += c.rating.average * c.rating.count;
    s.count += c.rating.count;
    s.products += 1;
    stats.set(c.shop.slug, s);
  }
  let rows: { slug: string; name: string; city: string; country: string; verified: boolean }[];
  if (!supabaseEnabled) {
    rows = demo.shops.filter((s) => demoShopType(s.slug) === type);
  } else {
    const { data } = await supabasePublic().from("shops").select("slug, name, city, country").eq("status", "approved").eq("category", type);
    rows = (data ?? []).map((s) => ({ ...s, verified: true }));
  }
  return rows
    .map((s) => {
      const st = stats.get(s.slug);
      return { ...s, average: st?.count ? Math.round((st.sum / st.count) * 10) / 10 : 0, reviews: st?.count ?? 0, products: st?.products ?? 0 };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
}

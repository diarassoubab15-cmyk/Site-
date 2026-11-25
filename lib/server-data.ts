import "server-only";
/** Chargement des données réelles des pages privées (mode Supabase). */
import { currentUser } from "./supabase/server";
import type { NotificationPrefs, Ticket } from "./demo-store";
import type { PaymentMethodId } from "./payments";
import { paymentMethods } from "./payments";
import { orderStatusFr, shopStatusFr, subPaymentStatusFr, ticketKindFr, ticketStatusFr, type LiveAccount, type EditRequestView, type LiveAdmin, type LiveSeller } from "./views";
import type { DemoSubPayment } from "./demo-store";
import { adminPaymentInfo, subscriptionMethods } from "./payment-info";
import { periodOf, type RewardView } from "./rewards";
import { storageUrl } from "./site-videos";
import type { ManualSaleView, VideoView } from "./views";

const VIDEO_QUOTA: Record<string, number> = { decouverte: 0, essentiel: 1, pro: 3, business: 10 };
type VideoRow = { id: string; ref: string; shop_id: string; description: string; status: string; video_path: string | null; poster_path: string | null; is_active: boolean; script: unknown; admin_note: string | null; error: string | null; created_at: string };
const videoView = (v: VideoRow, shopName?: string): VideoView => ({
  id: v.id, ref: v.ref, shopId: v.shop_id, shopName, description: v.description, status: v.status as VideoView["status"],
  videoUrl: v.video_path ? storageUrl(v.video_path) : null, posterUrl: v.poster_path ? storageUrl(v.poster_path) : null, isActive: v.is_active,
  headline: (v.script as { headline?: string } | null)?.headline, scriptSource: (v.script as { source?: string } | null)?.source,
  adminNote: v.admin_note ?? undefined, error: v.error ?? undefined, createdAt: v.created_at.slice(0, 10),
});

type RewardRow = { id: string; shop_id: string; kind: string; period_key: string; title: string; free_months: number; starts_on: string | null; ends_on: string | null; note: string | null; revoked_at: string | null; created_at: string };
const rewardView = (r: RewardRow, shopName = ""): RewardView => ({
  id: r.id, shopId: r.shop_id, shopName, kind: r.kind as RewardView["kind"], periodKey: r.period_key, title: r.title, freeMonths: r.free_months,
  startsOn: r.starts_on, endsOn: r.ends_on, note: r.note ?? undefined, revoked: !!r.revoked_at, createdAt: r.created_at.slice(0, 10),
});

type PaymentRow = { id: string; ref: string; shop_id: string; plan: string; annual: boolean; amount: number; method?: string; status: string; operator_ref: string | null; payer_phone: string | null; admin_note: string | null; created_at: string };
const paymentView = (p: PaymentRow, extra: Partial<DemoSubPayment> = {}): DemoSubPayment => ({
  id: p.id, ref: p.ref, shopId: p.shop_id, plan: p.plan, annual: p.annual, amount: p.amount, method: (p.method ?? "orange_money") as DemoSubPayment["method"], status: subPaymentStatusFr[p.status],
  operatorRef: p.operator_ref ?? undefined, payerPhone: p.payer_phone ?? undefined, adminNote: p.admin_note ?? undefined, createdAt: p.created_at.slice(0, 10), ...extra,
});

type Sb = NonNullable<Awaited<ReturnType<typeof currentUser>>>["sb"];

async function prefsOf(sb: Sb, userId: string): Promise<NotificationPrefs> {
  const { data: p } = await sb.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
  return {
    orderUpdates: p?.order_updates ?? true,
    deliveryUpdates: p?.delivery_updates ?? true,
    reviewRequest: p?.review_request ?? true,
    promotions: p?.promotions ?? false,
    newsletter: p?.newsletter ?? false,
    sellerNewOrder: p?.seller_new_order ?? true,
    sellerWeeklySummary: p?.seller_weekly_summary ?? true,
  };
}

const ticketView = (t: { id: string; kind: string; message: string; status: string; created_at: string; order_ref: string | null; order_id: string | null; shop_name: string | null; shop_id: string | null }): Ticket & { shopId?: string } => ({
  id: t.id.slice(0, 8).toUpperCase(),
  kind: ticketKindFr[t.kind],
  subject: { contact: "Question", signalement: "Signalement d'un vendeur", remboursement: "Produit non reçu" }[ticketKindFr[t.kind]],
  message: t.message,
  orderId: t.order_ref ?? undefined,
  orderUuid: t.order_id ?? undefined,
  shop: t.shop_name ?? undefined,
  shopId: t.shop_id ?? undefined,
  status: ticketStatusFr[t.status],
  createdAt: t.created_at.slice(0, 10),
  // l'identifiant complet sert aux actions de l'administrateur
  ...({ uuid: t.id } as object),
});

export async function loadAccount(): Promise<LiveAccount | null> {
  const u = await currentUser();
  if (!u) return null;
  const { sb, user, profile } = u;
  const [{ data: orders }, { data: tickets }, prefs] = await Promise.all([
    sb.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
    sb.from("tickets").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
    prefsOf(sb, user.id),
  ]);
  return {
    profile: { name: profile?.full_name ?? "", email: user.email ?? "", phone: profile?.phone ?? user.phone ?? "", city: profile?.city ?? "", country: profile?.country ?? "", district: profile?.district ?? "", landmark: profile?.landmark ?? "" },
    orders: (orders ?? []).map((o) => ({
      id: o.ref, uuid: o.id, product: o.product_slug ?? "", productName: o.product_name ?? "Produit retiré", shop: o.shop_name ?? "",
      qty: o.qty, total: o.total, method: o.method as PaymentMethodId, status: orderStatusFr[o.status], createdAt: o.created_at.slice(0, 10),
      etaMin: o.eta_min, etaMax: o.eta_max,
    })),
    tickets: (tickets ?? []).map(ticketView),
    prefs,
  };
}

export async function loadSeller(): Promise<LiveSeller | null> {
  const u = await currentUser();
  if (!u) return null;
  const { sb, user, profile } = u;
  const owner = { name: profile?.full_name ?? "", phone: profile?.phone ?? user.phone ?? "" };
  const { data: shops } = await sb.from("shops").select("id, name, status, created_at").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1);
  const shop = shops?.[0];
  const prefs = await prefsOf(sb, user.id);
  if (!shop) return { shop: null, payouts: [], orders: [], prefs, subscription: null, payment: null, payInfo: null, owner, coveredUntil: null, rewards: [], stats: null, videos: [], videoQuota: { used: 0, limit: 0 } };
  const [{ data: sub }, { data: payouts }, { data: orders }, { data: pays }] = await Promise.all([
    sb.from("subscriptions").select("plan, annual, active, current_period_end").eq("shop_id", shop.id).maybeSingle(),
    sb.from("payout_accounts").select("id, type, last4").eq("shop_id", shop.id),
    sb.from("orders").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(100),
    sb.from("subscription_payments").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(1),
  ]);
  const now = new Date();
  const month = periodOf("month", `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`)!;
  const [{ data: covered }, { data: rw }, { data: st }, { data: vids }, { data: sales }, { count: leads }, { data: prods }, { data: couriers }, { data: refusals }] = await Promise.all([
    sb.rpc("shop_covered_until", { p_shop: shop.id }),
    sb.from("rewards").select("*").eq("shop_id", shop.id).is("revoked_at", null).order("created_at", { ascending: false }),
    sb.rpc("seller_my_stats", { p_from: month.from, p_to: month.to }),
    sb.from("shop_videos").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(20),
    sb.from("manual_sales").select("id, label, qty, amount, channel, customer_name, customer_phone, sold_on").eq("shop_id", shop.id).order("sold_on", { ascending: false }).order("created_at", { ascending: false }).limit(60),
    sb.from("whatsapp_leads").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).gte("created_at", month.from),
    sb.from("products").select("id, name, price, stock, category, published").eq("shop_id", shop.id).order("name").limit(500),
    sb.from("shop_couriers").select("id, name, phone").eq("shop_id", shop.id).order("created_at"),
    sb.rpc("seller_order_refusals"),
  ]);
  const refusalsByOrder = new Map((refusals ?? []).map((x) => [x.order_id, x.refusals]));
  const monthStart = month.from.slice(0, 10);
  const monthSales = (sales ?? []).filter((x) => x.sold_on >= monthStart);
  const videosUsed = (vids ?? []).filter((v) => v.status !== "failed" && v.created_at.slice(0, 10) >= monthStart).length;
  const s0 = st?.[0];
  const payment = pays?.[0] ? paymentView(pays[0]) : null;
  return {
    owner,
    coveredUntil: covered && covered !== "infinity" ? String(covered) : null,
    videos: (vids ?? []).map((v) => videoView(v)),
    videoQuota: { used: videosUsed, limit: VIDEO_QUOTA[sub?.plan ?? "decouverte"] ?? 0 },
    rewards: (rw ?? []).map((r) => rewardView(r, shop.name)),
    stats: s0 ? { delivered: s0.delivered, revenue: Number(s0.revenue), openOrders: s0.open_orders, rating: s0.rating === null ? null : Number(s0.rating), reviews: s0.reviews, rank: shop.status === "approved" ? s0.rank : null, competitors: s0.competitors } : null,
    subscription: sub ? { plan: sub.plan, annual: sub.annual, active: sub.active, until: sub.current_period_end } : null,
    payment,
    // Les coordonnées de paiement ne quittent le serveur qu'après le contact confirmé par l'admin.
    payInfo: payment?.status === "paiement" ? adminPaymentInfo(payment.method) : null,
    payMethods: subscriptionMethods(),
    shop: { id: shop.id, shopName: shop.name, status: shopStatusFr[shop.status], plan: sub?.plan ?? null },
    payouts: (payouts ?? []).map((p) => ({ id: p.id, type: p.type, label: p.type === "bank" ? "Compte bancaire" : paymentMethods[p.type as PaymentMethodId].label, masked: `•••• ${p.last4}` })),
    orders: (orders ?? []).map((o) => ({
      id: o.ref, uuid: o.id, product: o.product_slug ?? "", productName: o.product_name ?? "", shop: o.shop_name ?? "", qty: o.qty, total: o.total,
      method: o.method as PaymentMethodId, status: orderStatusFr[o.status], createdAt: o.created_at.slice(0, 10),
      etaMin: o.eta_min, etaMax: o.eta_max,
      buyer: o.shipping_name, phone: o.shipping_phone,
      // Adresse à la malienne pour le livreur : quartier, ville, point de repère, zone choisie.
      city: [o.shipping_district, o.shipping_city].filter(Boolean).join(", ") + (o.shipping_landmark ? ` · repère : ${o.shipping_landmark}` : "") + (o.delivery_zone ? ` · livraison ${o.delivery_zone}${o.delivery_fee ? ` (${o.delivery_fee.toLocaleString("fr-FR")} F)` : ""}` : ""),
      cod: {
        confirmToken: o.confirm_token, buyerConfirmed: !!o.buyer_confirmed_at, courierId: o.courier_id, courierToken: o.courier_token,
        refused: !!o.refused_at, cashCollected: !!o.cash_collected_at, cashSettled: !!o.cash_settled_at, deliveryFee: o.delivery_fee ?? 0,
        // Refus passés de ce client sur tout NEXORA (cette commande comprise si elle a été refusée).
        buyerRefusals: refusalsByOrder.get(o.id) ?? 0,
      },
    })),
    couriers: couriers ?? [],
    // Alerte de stock : produits en ligne à 3 unités ou moins (hors immobilier, où « stock » = biens disponibles).
    lowStock: (prods ?? []).filter((p) => p.published && p.category !== "immobilier" && p.stock <= 3).map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
    prefs,
    offline: {
      sales: (sales ?? []).map((x) => ({ id: x.id, label: x.label, qty: x.qty, amount: x.amount, channel: x.channel as ManualSaleView["channel"], customer: x.customer_name ?? "", phone: x.customer_phone ?? "", soldOn: x.sold_on })),
      monthCount: monthSales.length,
      monthAmount: monthSales.reduce((n, x) => n + x.amount, 0),
      leads: leads ?? 0,
      products: (prods ?? []).map((p) => ({ id: p.id, name: p.name, price: p.price })),
    },
  };
}

export async function loadAdmin(): Promise<LiveAdmin | null> {
  const u = await currentUser();
  if (!u || u.profile?.role !== "admin") return null;
  const { sb } = u;
  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString();
  const [{ data: shopRows }, { data: contacts }, { data: tickets }, { data: pays }, { data: rw }, { data: vids }, { data: edits }, { data: subs }, { data: paid }] = await Promise.all([
    sb.from("shops").select("id, name, city, country, category, status, status_reason, verified_at, created_at").order("created_at", { ascending: false }),
    // Coordonnées du responsable : jamais lisibles directement, seulement par cette fonction réservée à l'admin.
    sb.rpc("admin_shop_contacts"),
    sb.from("tickets").select("*").order("created_at", { ascending: false }).limit(200),
    sb.from("subscription_payments").select("*").order("created_at", { ascending: false }).limit(100),
    sb.from("rewards").select("*").order("created_at", { ascending: false }).limit(200),
    sb.from("shop_videos").select("*").in("status", ["queued", "rendering", "review", "approved"]).order("created_at", { ascending: false }).limit(100),
    sb.from("product_edit_requests").select(EDIT_COLS).eq("status", "review").order("created_at").limit(100),
    sb.from("subscriptions").select("shop_id, plan, active, current_period_end"),
    // Revenus : paiements de forfait confirmés depuis le début du mois dernier.
    sb.from("subscription_payments").select("amount, plan, decided_at").eq("status", "confirmed").gte("decided_at", since).limit(5000),
  ]);
  const subByShop = new Map((subs ?? []).map((x) => [x.shop_id, x]));
  const contactById = new Map((contacts ?? []).map((c) => [c.id, c]));
  const shops = (shopRows ?? []).map((s) => ({ ...s, owner_name: contactById.get(s.id)?.owner_name ?? null, contact_email: contactById.get(s.id)?.contact_email ?? null, contact_phone: contactById.get(s.id)?.contact_phone ?? null }));
  const shopById = new Map(shops.map((s) => [s.id, s]));
  return {
    videos: (vids ?? []).map((v) => videoView(v, shopById.get(v.shop_id)?.name ?? "")),
    edits: (edits ?? []).map((e) => editView(e, shopById.get(e.shop_id)?.name ?? "")),
    rewards: (rw ?? []).map((r) => rewardView(r, shopById.get(r.shop_id)?.name ?? "")),
    payments: (pays ?? []).map((p) => {
      const s = shopById.get(p.shop_id);
      return paymentView(p, { shopName: s?.name, owner: s?.owner_name ?? undefined, ownerPhone: s?.contact_phone ?? undefined });
    }),
    sellers: shops.map((s) => ({
      id: s.id, shopName: s.name, owner: s.owner_name ?? "", email: s.contact_email ?? "", phone: s.contact_phone ?? "",
      city: s.city, country: s.country, category: s.category, status: shopStatusFr[s.status], createdAt: s.created_at.slice(0, 10),
      reason: s.status_reason ?? null,
      verified: !!s.verified_at,
      plan: subByShop.get(s.id)?.plan ?? null,
      // Actif = coché ET pas encore expiré (même règle que la base pour afficher la boutique).
      planActive: !!subByShop.get(s.id)?.active && (!subByShop.get(s.id)?.current_period_end || subByShop.get(s.id)!.current_period_end! > new Date().toISOString()),
      planUntil: subByShop.get(s.id)?.current_period_end?.slice(0, 10) ?? null,
    })),
    tickets: (tickets ?? []).map(ticketView),
    revenue: revenueOf(paid ?? [], subs ?? [], new Map(shops.map((x) => [x.id, x.name]))),
  };
}

/** Tableau des revenus de l'admin : encaissé ce mois et le mois dernier, par forfait, vendeurs payants et renouvellements proches. */
function revenueOf(
  paid: { amount: number; plan: string; decided_at: string | null }[],
  subs: { shop_id: string; plan: string; active: boolean; current_period_end: string | null }[],
  names: Map<string, string>,
) {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  const month = (m: string) => paid.filter((p) => p.decided_at?.slice(0, 7) === m);
  const byPlan: Record<string, number> = {};
  for (const p of month(thisMonth)) byPlan[p.plan] = (byPlan[p.plan] ?? 0) + p.amount;
  const live = subs.filter((x) => x.active && (!x.current_period_end || x.current_period_end > now.toISOString()));
  const in7 = new Date(now.getTime() + 7 * 864e5).toISOString();
  return {
    thisMonth: month(thisMonth).reduce((n, p) => n + p.amount, 0),
    lastMonth: month(lastMonth).reduce((n, p) => n + p.amount, 0),
    paymentsThisMonth: month(thisMonth).length,
    byPlan,
    paying: live.filter((x) => x.plan !== "decouverte").length,
    free: live.filter((x) => x.plan === "decouverte").length,
    renewals: live
      .filter((x) => x.plan !== "decouverte" && x.current_period_end && x.current_period_end <= in7)
      .map((x) => ({ shop: names.get(x.shop_id) ?? "—", plan: x.plan, until: x.current_period_end!.slice(0, 10) }))
      .sort((a, b) => a.until.localeCompare(b.until)),
  };
}

/** Pour les formulaires : ce qu'on sait déjà de l'utilisateur (pour ne rien redemander). */
export async function loadKnownUser() {
  const u = await currentUser();
  if (!u) return null;
  const { data: orders } = await u.sb.from("orders").select("id, ref, product_name, shop_name").eq("buyer_id", u.user.id).order("created_at", { ascending: false }).limit(50);
  const { data: shop } = await u.sb.from("shops").select("id, status").eq("owner_id", u.user.id).neq("status", "closed").maybeSingle();
  return {
    email: u.user.email ?? "",
    phone: u.profile?.phone ?? u.user.phone ?? "",
    name: u.profile?.full_name ?? "",
    city: u.profile?.city ?? "",
    country: u.profile?.country ?? "",
    orders: (orders ?? []).map((o) => ({ uuid: o.id, ref: o.ref, productName: o.product_name ?? "", shop: o.shop_name ?? "" })),
    shopStatus: shop ? shopStatusFr[shop.status] : null,
  };
}
export type KnownUser = NonNullable<Awaited<ReturnType<typeof loadKnownUser>>>;

// ------------------------------------------------------------------ produits du vendeur
export type SellerProductMedia = { id: string; kind: "photo" | "pano" | "spin" | "model3d"; url: string; label: string | null; position: number; aiGenerated: boolean; status: string };
export type SellerProduct = {
  id: string; slug: string; name: string; category: string; subcategory: string | null; price: number; priceUnit: "mois" | "nuit" | "jour" | null; compareAt: number | null;
  stock: number; short: string; description: string; specs: [string, string][]; wholesaleMin: number | null; wholesalePrice: number | null;
  published: boolean; madeInMali: boolean; handmade: boolean; media: SellerProductMedia[];
};

const productMediaUrl = (path: string) => `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/product-media/${path}`;

/** La boutique du vendeur connecté et ses produits (avec médias). */
export async function loadSellerProducts(): Promise<{ shop: { id: string; status: string; name: string } | null; products: SellerProduct[] } | null> {
  const u = await currentUser();
  if (!u) return null;
  const { data: shop } = await u.sb.from("shops").select("id, status, name").eq("owner_id", u.user.id).neq("status", "closed").maybeSingle();
  if (!shop) return { shop: null, products: [] };
  const { data } = await u.sb
    .from("products")
    .select("id, slug, name, category, subcategory, price, price_unit, compare_at, stock, short, description, specs, wholesale_min, wholesale_price, published, made_in_mali, handmade, product_media(id, kind, path, label, position, ai_generated, status)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });
  return {
    shop,
    products: (data ?? []).map((p) => ({
      id: p.id, slug: p.slug, name: p.name, category: p.category, subcategory: p.subcategory, price: p.price, priceUnit: p.price_unit as SellerProduct["priceUnit"], compareAt: p.compare_at,
      stock: p.stock, short: p.short ?? "", description: p.description ?? "", specs: Array.isArray(p.specs) ? (p.specs as [string, string][]) : [],
      wholesaleMin: p.wholesale_min, wholesalePrice: p.wholesale_price, published: p.published, madeInMali: p.made_in_mali, handmade: p.handmade,
      media: (p.product_media ?? [])
        .map((m) => ({ id: m.id, kind: m.kind, url: productMediaUrl(m.path), label: m.label, position: m.position, aiGenerated: m.ai_generated, status: m.status }))
        .sort((a, b) => a.position - b.position),
    })),
  };
}

// ------------------------------------------------------------------ modifications demandées par écrit
const EDIT_COLS = "id, product_id, shop_id, message, status, proposal, ai, applied, admin_note, created_at, products(name, slug, short, description, price, compare_at, specs)";
type EditRow = {
  id: string; product_id: string; shop_id: string; message: string; status: EditRequestView["status"]; proposal: unknown; ai: boolean; applied: unknown;
  admin_note: string | null; created_at: string;
  products: { name: string; slug: string; short: string | null; description: string | null; price: number; compare_at: number | null; specs: unknown } | null;
};
function editView(e: EditRow, shopName: string): EditRequestView {
  const p = e.products;
  return {
    id: e.id, productId: e.product_id, productName: p?.name ?? "", productSlug: p?.slug ?? "", shopName, message: e.message, status: e.status,
    proposal: (e.proposal as EditRequestView["proposal"]) ?? null, ai: e.ai, applied: (e.applied as EditRequestView["applied"]) ?? null,
    adminNote: e.admin_note, createdAt: e.created_at,
    current: {
      name: p?.name ?? "", short: p?.short ?? null, description: p?.description ?? null, price: p?.price ?? 0, compareAt: p?.compare_at ?? null,
      specs: Array.isArray(p?.specs) ? (p.specs as [string, string][]) : [],
    },
  };
}

/** Demandes de modification d'un produit (vendeur propriétaire ; la RLS filtre). */
export async function loadEditRequests(productId: string): Promise<EditRequestView[]> {
  const u = await currentUser();
  if (!u) return [];
  const { data } = await u.sb.from("product_edit_requests").select(EDIT_COLS).eq("product_id", productId).order("created_at", { ascending: false }).limit(20);
  return (data ?? []).map((e) => editView(e as EditRow, ""));
}

// ------------------------------------------------------------------ fiche publique de la boutique (vendeur)
export type ShopProfile = {
  slug: string; name: string; category: string; city: string; country: string; district: string; isPhysical: boolean; mapsUrl: string;
  whatsapp: string; callPhone: string; samples: { name: string; price: number }[];
  brandColor: string | null; signature: string | null; displayFont: string | null; tier: "essentiel" | "pro" | "business" | null;
  fbPixel: string; tiktokPixel: string; shipDays: number; returnPolicy: string | null;
  /** Boutique autorisée (en ligne) : son lien fonctionne pour les clients. */
  approved: boolean;
};
export async function loadShopProfile(): Promise<ShopProfile | null> {
  const u = await currentUser();
  if (!u) return null;
  const { data: s } = await u.sb
    .from("shops")
    .select("id, slug, name, status, category, city, country, district, is_physical, maps_url, whatsapp, call_phone, sample_prices, brand_color, signature, display_font, fb_pixel_id, tiktok_pixel_id, ship_days, return_policy")
    .eq("owner_id", u.user.id)
    .neq("status", "closed")
    .maybeSingle();
  if (!s) return null;
  const { data: sub } = await u.sb.from("subscriptions").select("plan").eq("shop_id", s.id).maybeSingle();
  return {
    fbPixel: s.fb_pixel_id ?? "", tiktokPixel: s.tiktok_pixel_id ?? "", shipDays: s.ship_days ?? 2, returnPolicy: s.return_policy ?? null,
    brandColor: s.brand_color, signature: s.signature, displayFont: s.display_font, tier: sub?.plan === "decouverte" ? "essentiel" : (sub?.plan as ShopProfile["tier"]) ?? null,
    approved: s.status === "approved",
    slug: s.slug, name: s.name, category: s.category, city: s.city, country: s.country, district: s.district ?? "", isPhysical: s.is_physical, mapsUrl: s.maps_url ?? "",
    whatsapp: s.whatsapp ?? "", callPhone: s.call_phone ?? "", samples: Array.isArray(s.sample_prices) ? (s.sample_prices as ShopProfile["samples"]) : [],
  };
}

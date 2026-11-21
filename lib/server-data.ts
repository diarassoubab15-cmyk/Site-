import "server-only";
/** Chargement des données réelles des pages privées (mode Supabase). */
import { currentUser } from "./supabase/server";
import type { NotificationPrefs, Ticket } from "./demo-store";
import type { PaymentMethodId } from "./payments";
import { paymentMethods } from "./payments";
import { orderStatusFr, shopStatusFr, subPaymentStatusFr, ticketKindFr, ticketStatusFr, type LiveAccount, type LiveAdmin, type LiveSeller } from "./views";
import type { DemoSubPayment } from "./demo-store";
import { adminPaymentInfo } from "./payment-info";
import { periodOf, type RewardView } from "./rewards";
import { storageUrl } from "./site-videos";
import type { VideoView } from "./views";

const VIDEO_QUOTA: Record<string, number> = { essentiel: 1, pro: 3, business: 10 };
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

type PaymentRow = { id: string; ref: string; shop_id: string; plan: string; annual: boolean; amount: number; status: string; operator_ref: string | null; payer_phone: string | null; admin_note: string | null; created_at: string };
const paymentView = (p: PaymentRow, extra: Partial<DemoSubPayment> = {}): DemoSubPayment => ({
  id: p.id, ref: p.ref, shopId: p.shop_id, plan: p.plan, annual: p.annual, amount: p.amount, status: subPaymentStatusFr[p.status],
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
    profile: { name: profile?.full_name ?? "", email: user.email ?? "", phone: profile?.phone ?? user.phone ?? "", city: profile?.city ?? "", country: profile?.country ?? "" },
    orders: (orders ?? []).map((o) => ({
      id: o.ref, uuid: o.id, product: o.product_slug ?? "", productName: o.product_name ?? "Produit retiré", shop: o.shop_name ?? "",
      qty: o.qty, total: o.total, method: o.method as PaymentMethodId, status: orderStatusFr[o.status], createdAt: o.created_at.slice(0, 10),
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
  const [{ data: covered }, { data: rw }, { data: st }, { data: vids }] = await Promise.all([
    sb.rpc("shop_covered_until", { p_shop: shop.id }),
    sb.from("rewards").select("*").eq("shop_id", shop.id).is("revoked_at", null).order("created_at", { ascending: false }),
    sb.rpc("seller_my_stats", { p_from: month.from, p_to: month.to }),
    sb.from("shop_videos").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const monthStart = month.from.slice(0, 10);
  const videosUsed = (vids ?? []).filter((v) => v.status !== "failed" && v.created_at.slice(0, 10) >= monthStart).length;
  const s0 = st?.[0];
  const payment = pays?.[0] ? paymentView(pays[0]) : null;
  return {
    owner,
    coveredUntil: covered && covered !== "infinity" ? String(covered) : null,
    videos: (vids ?? []).map((v) => videoView(v)),
    videoQuota: { used: videosUsed, limit: VIDEO_QUOTA[sub?.plan ?? "essentiel"] ?? 1 },
    rewards: (rw ?? []).map((r) => rewardView(r, shop.name)),
    stats: s0 ? { delivered: s0.delivered, revenue: Number(s0.revenue), openOrders: s0.open_orders, rating: s0.rating === null ? null : Number(s0.rating), reviews: s0.reviews, rank: shop.status === "approved" ? s0.rank : null, competitors: s0.competitors } : null,
    subscription: sub ? { plan: sub.plan, annual: sub.annual, active: sub.active, until: sub.current_period_end } : null,
    payment,
    // Les coordonnées de paiement ne quittent le serveur qu'après le contact confirmé par l'admin.
    payInfo: payment?.status === "paiement" ? adminPaymentInfo() : null,
    shop: { id: shop.id, shopName: shop.name, status: shopStatusFr[shop.status], plan: sub?.plan ?? null },
    payouts: (payouts ?? []).map((p) => ({ id: p.id, type: p.type, label: p.type === "bank" ? "Compte bancaire" : paymentMethods[p.type as PaymentMethodId].label, masked: `•••• ${p.last4}` })),
    orders: (orders ?? []).map((o) => ({
      id: o.ref, uuid: o.id, product: o.product_slug ?? "", productName: o.product_name ?? "", shop: o.shop_name ?? "", qty: o.qty, total: o.total,
      method: o.method as PaymentMethodId, status: orderStatusFr[o.status], createdAt: o.created_at.slice(0, 10),
      buyer: o.shipping_name, city: o.shipping_city, phone: o.shipping_phone,
    })),
    prefs,
  };
}

export async function loadAdmin(): Promise<LiveAdmin | null> {
  const u = await currentUser();
  if (!u || u.profile?.role !== "admin") return null;
  const { sb } = u;
  const [{ data: shops }, { data: tickets }, { data: pays }, { data: rw }, { data: vids }] = await Promise.all([
    sb.from("shops").select("id, name, owner_name, contact_email, contact_phone, city, country, category, status, created_at").order("created_at", { ascending: false }),
    sb.from("tickets").select("*").order("created_at", { ascending: false }).limit(200),
    sb.from("subscription_payments").select("*").order("created_at", { ascending: false }).limit(100),
    sb.from("rewards").select("*").order("created_at", { ascending: false }).limit(200),
    sb.from("shop_videos").select("*").in("status", ["queued", "rendering", "review", "approved"]).order("created_at", { ascending: false }).limit(100),
  ]);
  const shopById = new Map((shops ?? []).map((s) => [s.id, s]));
  return {
    videos: (vids ?? []).map((v) => videoView(v, shopById.get(v.shop_id)?.name ?? "")),
    rewards: (rw ?? []).map((r) => rewardView(r, shopById.get(r.shop_id)?.name ?? "")),
    payments: (pays ?? []).map((p) => {
      const s = shopById.get(p.shop_id);
      return paymentView(p, { shopName: s?.name, owner: s?.owner_name ?? undefined, ownerPhone: s?.contact_phone ?? undefined });
    }),
    sellers: (shops ?? []).map((s) => ({
      id: s.id, shopName: s.name, owner: s.owner_name ?? "", email: s.contact_email ?? "", phone: s.contact_phone ?? "",
      city: s.city, country: s.country, category: s.category, status: shopStatusFr[s.status], createdAt: s.created_at.slice(0, 10),
    })),
    tickets: (tickets ?? []).map(ticketView),
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

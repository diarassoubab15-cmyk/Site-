"use server";
/**
 * Actions serveur (mode Supabase). Chaque action s'exécute avec la session de l'utilisateur :
 * les règles RLS et les déclencheurs de la base restent le dernier rempart, quoi qu'envoie le navigateur.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser, supabaseServer, supabaseService } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import { shopStatusDb, ticketKindDb, type ActionResult } from "@/lib/views";
import type { SellerStatus } from "@/lib/demo-store";
import { periodOf, rewardTitle, type RankingRow } from "@/lib/rewards";

const PAYMENT = z.enum(["orange_money", "wave", "mtn_momo", "moov_money", "card", "cash_on_delivery"]);
const PAYOUT = z.enum(["orange_money", "wave", "mtn_momo", "moov_money", "card", "bank"]);
const PHONE = z.string().trim().regex(/^[+0-9 ]{8,20}$/, "Numéro de téléphone invalide");

const fail = (error: string, login = false): ActionResult<never> => ({ ok: false, error, login });
const dbError = (e: { message: string } | null) => fail(e?.message?.split("\n")[0] ?? "Erreur inattendue");

async function requireUser() {
  const u = await currentUser();
  if (!u) throw Object.assign(new Error("login"), { login: true });
  return u;
}

/** Enveloppe commune : validation, connexion requise, erreurs lisibles. */
function action<I, O>(schema: z.ZodType<I>, fn: (input: I, u: Awaited<ReturnType<typeof requireUser>>) => Promise<ActionResult<O>>) {
  return async (raw: unknown): Promise<ActionResult<O>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides");
    try {
      return await fn(parsed.data, await requireUser());
    } catch (e) {
      if ((e as { login?: boolean }).login) return fail("Connectez-vous pour continuer.", true);
      console.error(e);
      return fail("Erreur inattendue. Réessayez ou contactez le SAV.");
    }
  };
}

// ------------------------------------------------------------------ commandes
const placeOrderSchema = z.object({
  slug: z.string().min(1),
  qty: z.number().int().min(1).max(10000),
  method: PAYMENT,
  shipping: z.object({ name: z.string().trim().min(2).max(80), phone: PHONE, city: z.string().trim().min(2).max(120) }).optional(),
});

export const placeOrder = action<z.infer<typeof placeOrderSchema>, string>(placeOrderSchema, async (input, { user, profile, sb }) => {
  const { data: product } = await sb.from("products").select("id, shop_id").eq("slug", input.slug).single();
  if (!product) return fail("Produit indisponible");
  // Les coordonnées ne sont demandées qu'une fois : enregistrées sur le profil.
  if (input.shipping) {
    await sb.from("profiles").update({ full_name: input.shipping.name, phone: input.shipping.phone, city: input.shipping.city }).eq("id", user.id);
  }
  const name = input.shipping?.name ?? profile?.full_name;
  const phone = input.shipping?.phone ?? profile?.phone;
  const city = input.shipping?.city ?? profile?.city;
  if (!name || !phone || !city) return fail("Adresse de livraison incomplète");
  const { data, error } = await sb
    .from("orders")
    .insert({ buyer_id: user.id, shop_id: product.shop_id, product_id: product.id, qty: input.qty, total: 1, method: input.method, shipping_name: name, shipping_phone: phone, shipping_city: city })
    .select("ref")
    .single();
  if (error) return dbError(error);
  revalidatePath(`/produits/${input.slug}`);
  return { ok: true, data: data.ref };
});

export const markOrder = action(z.object({ id: z.string().uuid(), status: z.enum(["delivered", "not_received"]) }), async ({ id, status }, { user, sb }) => {
  const { data: order, error } = await sb.from("orders").update({ status }).eq("id", id).select("id, product_slug, ref").single();
  if (error) return dbError(error);
  if (status === "not_received") {
    await sb.from("tickets").insert({ author_id: user.id, kind: "refund", order_id: order.id, message: `Commande ${order.ref} non reçue.` });
  }
  revalidatePath("/compte");
  return { ok: true };
});

export const sellerUpdateOrder = action(z.object({ id: z.string().uuid(), status: z.enum(["shipped", "cancelled", "refunded"]) }), async ({ id, status }, { sb }) => {
  const { error } = await sb.from("orders").update({ status }).eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

// ------------------------------------------------------------------ avis
export const addReview = action(
  z.object({ orderId: z.string().uuid(), rating: z.number().int().min(1).max(5), title: z.string().trim().min(2).max(80), body: z.string().trim().min(5).max(1000) }),
  async (input, { user, sb }) => {
    const { data: order } = await sb.from("orders").select("product_id, product_slug").eq("id", input.orderId).single();
    if (!order?.product_id) return fail("Commande introuvable");
    const { error } = await sb.from("reviews").insert({ order_id: input.orderId, product_id: order.product_id, author_id: user.id, rating: input.rating, title: input.title, body: input.body });
    if (error) return fail(error.code === "23505" ? "Vous avez déjà laissé un avis pour cette commande." : "Seuls les acheteurs ayant reçu ce produit peuvent laisser un avis.");
    revalidatePath(`/produits/${order.product_slug}`);
    return { ok: true };
  },
);

// ------------------------------------------------------------------ SAV
const ticketSchema = z.object({
  kind: z.enum(["contact", "signalement", "remboursement"]),
  message: z.string().trim().min(5).max(2000),
  orderId: z.string().uuid().optional(),
  shopSlug: z.string().max(80).optional(),
  contact: z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email() }).optional(),
});

export async function createTicket(raw: unknown): Promise<ActionResult<string>> {
  const parsed = ticketSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides");
  const t = parsed.data;
  const u = await currentUser();
  if (!u) {
    // Sans compte : seules les questions simples sont acceptées (les litiges exigent d'être identifié).
    if (t.kind !== "contact" || !t.contact) return fail("Connectez-vous pour signaler un vendeur ou demander un remboursement.", true);
    const { data, error } = await supabaseService()
      .from("tickets")
      .insert({ author_id: null, kind: "contact", message: `[${t.contact.name} <${t.contact.email}>] ${t.message}` })
      .select("id")
      .single();
    return error ? dbError(error) : { ok: true, data: data.id.slice(0, 8).toUpperCase() };
  }
  let shopId: string | null = null;
  if (t.shopSlug) shopId = (await u.sb.from("shops").select("id").eq("slug", t.shopSlug).maybeSingle()).data?.id ?? null;
  const { data, error } = await u.sb
    .from("tickets")
    .insert({ author_id: u.user.id, kind: ticketKindDb[t.kind], message: t.message, order_id: t.orderId ?? null, shop_id: shopId })
    .select("id")
    .single();
  if (error) return dbError(error);
  if (t.kind === "remboursement" && t.orderId) await u.sb.from("orders").update({ status: "not_received" }).eq("id", t.orderId);
  revalidatePath("/compte");
  return { ok: true, data: data.id.slice(0, 8).toUpperCase() };
}

// ------------------------------------------------------------------ profil, préférences, compte
export const updateProfile = action(
  z.object({ name: z.string().trim().max(80), phone: z.string().trim().max(20), city: z.string().trim().max(120), country: z.string().trim().max(60) }),
  async (p, { user, sb }) => {
    const { error } = await sb.from("profiles").update({ full_name: p.name, phone: p.phone, city: p.city, country: p.country }).eq("id", user.id);
    if (error) return dbError(error);
    revalidatePath("/compte");
    return { ok: true };
  },
);

const prefKeys = {
  orderUpdates: "order_updates",
  deliveryUpdates: "delivery_updates",
  reviewRequest: "review_request",
  promotions: "promotions",
  newsletter: "newsletter",
  sellerNewOrder: "seller_new_order",
  sellerWeeklySummary: "seller_weekly_summary",
} as const;

export const savePrefs = action(z.record(z.enum(Object.keys(prefKeys) as [keyof typeof prefKeys]), z.boolean()), async (p, { user, sb }) => {
  const row = Object.fromEntries(Object.entries(p).map(([k, v]) => [prefKeys[k as keyof typeof prefKeys], v]));
  const { error } = await sb.from("notification_preferences").upsert({ user_id: user.id, ...row });
  return error ? dbError(error) : { ok: true };
});

export const deleteAccount = action(z.object({ confirm: z.literal(true) }), async (_, { user, sb }) => {
  // Les comptes d'encaissement et boutiques partent avec le compte ; l'historique des commandes est anonymisé.
  const { error } = await supabaseService().auth.admin.deleteUser(user.id);
  if (error) return dbError(error);
  await sb.auth.signOut();
  return { ok: true };
});

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------------ vendeurs
const applySchema = z.object({
  shopName: z.string().trim().min(2).max(60),
  category: z.string().min(1).max(40),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(60),
  owner: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: PHONE,
  payoutMethod: PAYOUT,
  payoutAccount: z.string().trim().min(6).max(40),
  cod: z.boolean(),
  plan: z.enum(["essentiel", "pro", "business"]),
});

export const applySeller = action(applySchema, async (f, { user, sb }) => {
  const { data: existing } = await sb.from("shops").select("id").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
  if (existing) return fail("Vous avez déjà une boutique.");
  const slug = `${slugify(f.shopName).slice(0, 50) || "boutique"}-${Math.random().toString(36).slice(2, 6)}`;
  const { data: shop, error } = await sb
    .from("shops")
    .insert({ owner_id: user.id, slug, name: f.shopName, category: f.category, city: f.city, country: f.country, accepts_cod: f.cod, owner_name: f.owner, contact_email: f.email, contact_phone: f.phone })
    .select("id")
    .single();
  if (error) return dbError(error);
  const digits = f.payoutAccount.replace(/\s/g, "");
  // En production : le compte est enregistré chez le prestataire de paiement, qui renvoie un jeton.
  await sb.from("payout_accounts").insert({ shop_id: shop.id, type: f.payoutMethod, provider_token: `a-relier:${f.payoutMethod}`, last4: digits.slice(-4) });
  await sb.from("subscriptions").insert({ shop_id: shop.id, plan: f.plan, active: false });
  await sb.from("profiles").update({ full_name: f.owner, phone: f.phone, city: f.city, country: f.country }).eq("id", user.id);
  revalidatePath("/vendeur");
  return { ok: true };
});

export const addPayout = action(z.object({ type: PAYOUT, number: z.string().trim().min(6).max(40) }), async ({ type, number }, { user, sb }) => {
  const { data: shop } = await sb.from("shops").select("id").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
  if (!shop) return fail("Aucune boutique active");
  const { error } = await sb.from("payout_accounts").insert({ shop_id: shop.id, type, provider_token: `a-relier:${type}`, last4: number.replace(/\s/g, "").slice(-4) });
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

export const removePayout = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("payout_accounts").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

export const closeShop = action(
  z.object({ shopId: z.string().uuid(), payouts: z.boolean(), subscription: z.boolean(), catalogue: z.boolean() }),
  async (o, { sb }) => {
    const { error } = await sb.rpc("close_my_shop", { p_shop: o.shopId, p_remove_payouts: o.payouts, p_cancel_subscription: o.subscription, p_unpublish: o.catalogue });
    if (error) return dbError(error);
    revalidatePath("/vendeur");
    revalidatePath("/marketplace");
    return { ok: true };
  },
);

// ------------------------------------------------------------------ administration
// Chaque action est revérifiée par la base (is_admin) : appeler ces fonctions sans être admin échoue.
const SHOP_STATUS = z.enum(["en attente", "autorisé", "suspendu", "refusé", "fermé"]);

export const adminSetShopStatus = action(z.object({ shopId: z.string().uuid(), status: SHOP_STATUS }), async ({ shopId, status }, { sb }) => {
  const { error } = await sb.rpc("admin_set_shop_status", { p_shop: shopId, p_status: shopStatusDb[status as SellerStatus] });
  if (error) return dbError(error);
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  revalidatePath("/", "layout");
  return { ok: true };
});

export const adminResolveTicket = action(z.object({ ticketId: z.string().uuid(), refundOrderId: z.string().uuid().optional() }), async ({ ticketId, refundOrderId }, { sb }) => {
  if (refundOrderId) {
    const { error } = await sb.from("orders").update({ status: "refunded" }).eq("id", refundOrderId);
    if (error) return dbError(error);
  }
  const { error } = await sb.from("tickets").update({ status: "resolved" }).eq("id", ticketId);
  if (error) return dbError(error);
  revalidatePath("/admin");
  return { ok: true };
});

// ------------------------------------------------------------------ contexte acheteur (fiche produit)
/**
 * Ce que la fiche produit doit savoir de l'utilisateur, sans embarquer le client Supabase
 * dans le navigateur (≈ 75 Ko de moins sur la page la plus visitée).
 */
export async function getBuyerContext(slug: string): Promise<{ loggedIn: boolean; known: { name: string; city: string } | null; reviewableOrderId: string | null }> {
  const u = await currentUser();
  if (!u) return { loggedIn: false, known: null, reviewableOrderId: null };
  const p = u.profile;
  const known = p?.full_name && p?.phone && p?.city ? { name: p.full_name, city: p.city } : null;
  const { data: orders } = await u.sb.from("orders").select("id").eq("buyer_id", u.user.id).eq("product_slug", String(slug).slice(0, 100)).eq("status", "delivered");
  let reviewableOrderId: string | null = null;
  if (orders?.length) {
    const { data: done } = await u.sb.from("reviews").select("order_id").in("order_id", orders.map((o) => o.id));
    const taken = new Set((done ?? []).map((d) => d.order_id));
    reviewableOrderId = orders.find((o) => !taken.has(o.id))?.id ?? null;
  }
  return { loggedIn: true, known, reviewableOrderId };
}

// ------------------------------------------------------------------ abonnements (Orange Money, contact admin obligatoire)
const PLAN = z.enum(["essentiel", "pro", "business"]);

async function myShopId(sb: Awaited<ReturnType<typeof requireUser>>["sb"], userId: string) {
  const { data } = await sb.from("shops").select("id").eq("owner_id", userId).neq("status", "closed").maybeSingle();
  return data?.id ?? null;
}

/** Étape 1 : le vendeur demande à payer. Il devra ensuite contacter l'admin (WhatsApp ou appel). */
export const requestSubscriptionPayment = action<{ plan: "essentiel" | "pro" | "business"; annual: boolean }, string>(
  z.object({ plan: PLAN, annual: z.boolean() }),
  async ({ plan, annual }, { user, sb }) => {
    const shopId = await myShopId(sb, user.id);
    if (!shopId) return fail("Aucune boutique active");
    const { data, error } = await sb.from("subscription_payments").insert({ shop_id: shopId, plan, annual }).select("ref").single();
    if (error) return fail(error.code === "23505" ? "Vous avez déjà une demande de paiement en cours." : error.message.split("\n")[0]);
    revalidatePath("/vendeur");
    return { ok: true, data: data.ref };
  },
);

/** Étape 3 : après avoir payé, le vendeur saisit le numéro de transaction reçu par SMS. */
export const declareSubscriptionPayment = action(
  z.object({ id: z.string().uuid(), operatorRef: z.string().trim().min(4, "Numéro de transaction trop court").max(40), payerPhone: PHONE }),
  async ({ id, operatorRef, payerPhone }, { sb }) => {
    const { error } = await sb.from("subscription_payments").update({ status: "declared", operator_ref: operatorRef, payer_phone: payerPhone }).eq("id", id);
    if (error) return fail(error.code === "23505" ? "Ce numéro de transaction a déjà été utilisé." : error.message.split("\n")[0]);
    revalidatePath("/vendeur");
    revalidatePath("/admin");
    return { ok: true };
  },
);

export const cancelSubscriptionPayment = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("subscription_payments").update({ status: "rejected" }).eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

/** Étape 2 (admin) : l'échange WhatsApp ou téléphonique a eu lieu ; le vendeur peut maintenant payer. */
export const adminMarkContacted = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.rpc("admin_mark_contacted", { p_payment: id });
  if (error) return dbError(error);
  revalidatePath("/admin");
  return { ok: true };
});

/** Étape 4 (admin) : argent reçu sur Orange Money, l'abonnement est prolongé et la boutique devient visible. */
export const adminConfirmPayment = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.rpc("admin_confirm_payment", { p_payment: id });
  if (error) return dbError(error);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: true };
});

export const adminRejectPayment = action(z.object({ id: z.string().uuid(), note: z.string().trim().max(500).optional() }), async ({ id, note }, { sb }) => {
  const { error } = await sb.rpc("admin_reject_payment", { p_payment: id, p_note: note || undefined });
  if (error) return dbError(error);
  revalidatePath("/admin");
  return { ok: true };
});

// ------------------------------------------------------------------ récompenses (admin seul)

const KIND = z.enum(["month", "semester", "year"]);

/** Classement d'une période. La base refuse l'appel si l'utilisateur n'est pas l'admin. */
export async function adminRanking(raw: unknown): Promise<ActionResult<RankingRow[]>> {
  const parsed = z.object({ kind: KIND, key: z.string().max(10) }).safeParse(raw);
  if (!parsed.success) return fail("Période invalide");
  const period = periodOf(parsed.data.kind, parsed.data.key);
  if (!period) return fail("Période invalide");
  const u = await currentUser();
  if (!u) return fail("Connectez-vous", true);
  const { data, error } = await u.sb.rpc("admin_seller_ranking", { p_from: period.from, p_to: period.to });
  if (error) return dbError(error);
  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      shopId: r.shop_id, shopName: r.shop_name, owner: r.owner_name ?? "", phone: r.contact_phone ?? "",
      delivered: r.delivered, revenue: Number(r.revenue), rating: r.rating === null ? null : Number(r.rating), reviews: r.reviews, disputes: r.disputes,
    })),
  };
}

export const adminGrantReward = action(
  z.object({
    shopId: z.string().uuid(),
    kind: z.enum(["month", "semester", "year", "gift"]),
    periodKey: z.string().max(10).optional(),
    freeMonths: z.number().int().min(0).max(12),
    startMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(), // mois choisi (ex. 2027-01) ; absent = à la suite de l'abonnement
    title: z.string().trim().min(2).max(120).optional(), // pour un cadeau libre
    note: z.string().trim().max(500).optional(),
  }),
  async (r, { sb }) => {
    let title = r.title ?? "Mois offerts par NEXORA";
    let periodKey = "gift";
    if (r.kind !== "gift") {
      if (!r.periodKey || !periodOf(r.kind, r.periodKey)) return fail("Période invalide");
      periodKey = r.periodKey;
      title = rewardTitle(r.kind, r.periodKey);
    }
    const { error } = await sb.rpc("admin_grant_reward", {
      p_shop: r.shopId, p_kind: r.kind, p_period_key: periodKey, p_title: title, p_free_months: r.freeMonths,
      p_start: r.startMonth ? `${r.startMonth}-01` : undefined, p_note: r.note || undefined,
    });
    if (error) return dbError(error);
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { ok: true };
  },
);

export const adminRevokeReward = action(z.object({ id: z.string().uuid(), note: z.string().trim().max(500).optional() }), async ({ id, note }, { sb }) => {
  const { error } = await sb.rpc("admin_revoke_reward", { p_reward: id, p_note: note || undefined });
  if (error) return dbError(error);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: true };
});

// ------------------------------------------------------------------ vidéos de boutique
export const requestShopVideo = action<{ description: string }, string>(
  z.object({ description: z.string().trim().min(20, "Décrivez votre boutique en 20 caractères au moins").max(1500, "1 500 caractères au maximum") }),
  async ({ description }, { user, sb }) => {
    const { data: shop } = await sb.from("shops").select("id").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
    if (!shop) return fail("Aucune boutique active");
    const { data, error } = await sb.from("shop_videos").insert({ shop_id: shop.id, description }).select("ref").single();
    if (error) return fail(error.code === "23505" ? "Une vidéo est déjà en cours de fabrication." : error.message.split("\n")[0]);
    revalidatePath("/vendeur");
    return { ok: true, data: data.ref };
  },
);

export const cancelShopVideo = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("shop_videos").update({ status: "cancelled" }).eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

export const adminReviewVideo = action(z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().trim().max(500).optional() }), async ({ id, approve, note }, { sb }) => {
  const { error } = await sb.rpc("admin_review_video", { p_video: id, p_approve: approve, p_note: note || undefined });
  if (error) return dbError(error);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: true };
});

export const adminUnpublishVideo = action(z.object({ id: z.string().uuid(), note: z.string().trim().max(500).optional() }), async ({ id, note }, { sb }) => {
  const { error } = await sb.rpc("admin_unpublish_video", { p_video: id, p_note: note || undefined });
  if (error) return dbError(error);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: true };
});

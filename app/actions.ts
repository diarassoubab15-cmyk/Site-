"use server";
/**
 * Actions serveur (mode Supabase). Chaque action s'exécute avec la session de l'utilisateur :
 * les règles RLS et les déclencheurs de la base restent le dernier rempart, quoi qu'envoie le navigateur.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser, supabaseServer, supabaseService } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import { categories } from "@/lib/data";
import { coordsFromMapsUrl, isMapsUrl } from "@/lib/maps";
import { aiUrl, mediaUrl as productMediaUrl } from "@/lib/catalog";
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
  shipping: z.object({
    name: z.string().trim().min(2).max(80), phone: PHONE, city: z.string().trim().min(2).max(120),
    district: z.string().trim().min(2, "Indiquez votre quartier").max(80), landmark: z.string().trim().max(160),
  }).optional(),
  zoneId: z.string().uuid().nullable().optional(),
});

export const placeOrder = action<z.infer<typeof placeOrderSchema>, string>(placeOrderSchema, async (input, { user, profile, sb }) => {
  const { data: product } = await sb.from("products").select("id, shop_id").eq("slug", input.slug).single();
  if (!product) return fail("Produit indisponible");
  // Les coordonnées ne sont demandées qu'une fois : enregistrées sur le profil.
  if (input.shipping) {
    await sb.from("profiles").update({ full_name: input.shipping.name, phone: input.shipping.phone, city: input.shipping.city, district: input.shipping.district, landmark: input.shipping.landmark || null }).eq("id", user.id);
  }
  const name = input.shipping?.name ?? profile?.full_name;
  const phone = input.shipping?.phone ?? profile?.phone;
  const city = input.shipping?.city ?? profile?.city;
  const district = input.shipping?.district ?? profile?.district ?? null;
  const landmark = input.shipping ? input.shipping.landmark || null : profile?.landmark ?? null;
  if (!name || !phone || !city) return fail("Adresse de livraison incomplète");
  const { data, error } = await sb
    .from("orders")
    .insert({ buyer_id: user.id, shop_id: product.shop_id, product_id: product.id, qty: input.qty, total: 1, method: input.method, shipping_name: name, shipping_phone: phone, shipping_city: city, shipping_district: district, shipping_landmark: landmark, delivery_zone_id: input.zoneId ?? null })
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
  // Signalement depuis une commande : la boutique est celle de la commande (elle sera suspendue jusqu'à la décision de l'admin).
  if (!shopId && t.orderId) shopId = (await u.sb.from("orders").select("shop_id").eq("id", t.orderId).maybeSingle()).data?.shop_id ?? null;
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
  z.object({ name: z.string().trim().max(80), phone: z.string().trim().max(30), city: z.string().trim().max(120), country: z.string().trim().max(60), district: z.string().trim().max(80).default(""), landmark: z.string().trim().max(160).default("") }),
  async (p, { user, sb }) => {
    const { error } = await sb.from("profiles").update({ full_name: p.name, phone: p.phone, city: p.city, country: p.country, district: p.district || null, landmark: p.landmark || null }).eq("id", user.id);
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
const sampleSchema = z.object({ name: z.string().trim().min(1, "Nom du produit manquant").max(60), price: z.number().int().min(1, "Prix invalide").max(1_000_000_000) });
const applySchema = z
  .object({
    shopName: z.string().trim().min(2, "Nom de boutique trop court").max(60),
    category: z.string().refine((v) => categories.some((c) => c.slug === v), "Choisissez le type de boutique"),
    samples: z.array(sampleSchema).min(1, "Indiquez au moins un produit et son prix").max(5),
    country: z.string().trim().min(2).max(60),
    city: z.string().trim().min(2).max(80),
    district: z.string().trim().max(80),
    isPhysical: z.boolean(),
    mapsUrl: z.string().trim().max(500).refine((v) => !v || isMapsUrl(v), "Collez un lien Google Maps (google.com/maps ou maps.app.goo.gl)"),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    whatsapp: PHONE,
    callPhone: PHONE,
    owner: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    payoutMethod: PAYOUT,
    payoutAccount: z.string().trim().min(6).max(40),
    cod: z.boolean(),
    plan: z.enum(["decouverte", "essentiel", "pro", "business"]),
  })
  .refine((f) => !f.isPhysical || f.mapsUrl || f.lat !== null, { message: "Boutique physique : collez le lien Google Maps ou utilisez votre position" });

export const applySeller = action(applySchema, async (f, { user, sb }) => {
  const { data: existing } = await sb.from("shops").select("id").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
  if (existing) return fail("Vous avez déjà une boutique.");
  const slug = `${slugify(f.shopName).slice(0, 50) || "boutique"}-${Math.random().toString(36).slice(2, 6)}`;
  // Adresse précise seulement pour une boutique physique ; coordonnées tirées du lien si besoin.
  const coords = f.isPhysical ? (f.lat !== null && f.lng !== null ? { lat: f.lat, lng: f.lng } : coordsFromMapsUrl(f.mapsUrl)) : null;
  const { data: shop, error } = await sb
    .from("shops")
    .insert({
      owner_id: user.id, slug, name: f.shopName, category: f.category, city: f.city, country: f.country, accepts_cod: f.cod,
      owner_name: f.owner, contact_email: f.email, contact_phone: f.callPhone,
      district: f.district || null, is_physical: f.isPhysical, maps_url: f.isPhysical && f.mapsUrl ? f.mapsUrl : null,
      lat: coords?.lat ?? null, lng: coords?.lng ?? null, whatsapp: f.whatsapp, call_phone: f.callPhone, sample_prices: f.samples,
    })
    .select("id")
    .single();
  if (error) return dbError(error);
  const digits = f.payoutAccount.replace(/\s/g, "");
  // En production : le compte est enregistré chez le prestataire de paiement, qui renvoie un jeton.
  // Numéro Orange Money / Wave / MTN / Moov : donné à l'acheteur après sa commande, pour qu'il paie le vendeur directement.
  const payNumber = f.payoutMethod !== "bank" && /^[+0-9 ]{6,40}$/.test(f.payoutAccount.trim()) ? f.payoutAccount.trim() : null;
  await sb.from("payout_accounts").insert({ shop_id: shop.id, type: f.payoutMethod, provider_token: `a-relier:${f.payoutMethod}`, last4: digits.slice(-4), pay_number: payNumber });
  await sb.from("subscriptions").insert({ shop_id: shop.id, plan: f.plan, active: false });
  await sb.from("profiles").update({ full_name: f.owner, phone: f.callPhone, city: f.city, country: f.country }).eq("id", user.id);
  revalidatePath("/vendeur");
  return { ok: true };
});

export const addPayout = action(z.object({ type: PAYOUT, number: z.string().trim().min(6).max(40) }), async ({ type, number }, { user, sb }) => {
  const { data: shop } = await sb.from("shops").select("id").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
  if (!shop) return fail("Aucune boutique active");
  const payNumber = type !== "bank" && type !== "card" && /^[+0-9 ]{6,40}$/.test(number) ? number : null;
  const { error } = await sb.from("payout_accounts").insert({ shop_id: shop.id, type, provider_token: `a-relier:${type}`, last4: number.replace(/\s/g, "").slice(-4), pay_number: payNumber });
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

/** Forfait d'un vendeur choisi par l'administrateur : activer (1 à 24 mois), changer ou désactiver. */
export const adminSetSubscription = action(
  z.object({ shopId: z.string().uuid(), plan: z.enum(["decouverte", "essentiel", "pro", "business"]), active: z.boolean(), months: z.number().int().min(1).max(24).default(1) }),
  async ({ shopId, plan, active, months }, { sb }) => {
    const { error } = await sb.rpc("admin_set_subscription", { p_shop: shopId, p_plan: plan, p_active: active, p_months: months });
    if (error) return dbError(error);
    revalidatePath("/admin");
    revalidatePath("/vendeur");
    revalidatePath("/", "layout");
    return { ok: true };
  },
);

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
export async function getBuyerContext(slug: string): Promise<{ loggedIn: boolean; known: { name: string; city: string; district?: string | null; landmark?: string | null } | null; reviewableOrderId: string | null; preferredPayment?: string | null }> {
  const u = await currentUser();
  if (!u) return { loggedIn: false, known: null, reviewableOrderId: null };
  const p = u.profile;
  // Ancien profil sans quartier : on redemande l'adresse une fois, au nouveau format malien.
  const known = p?.full_name && p?.phone && p?.city && p?.district ? { name: p.full_name, city: p.city, district: p.district, landmark: p.landmark } : null;
  const { data: orders } = await u.sb.from("orders").select("id").eq("buyer_id", u.user.id).eq("product_slug", String(slug).slice(0, 100)).eq("status", "delivered");
  let reviewableOrderId: string | null = null;
  if (orders?.length) {
    const { data: done } = await u.sb.from("reviews").select("order_id").in("order_id", orders.map((o) => o.id));
    const taken = new Set((done ?? []).map((d) => d.order_id));
    reviewableOrderId = orders.find((o) => !taken.has(o.id))?.id ?? null;
  }
  return { loggedIn: true, known, reviewableOrderId, preferredPayment: p?.preferred_payment ?? null };
}

// ------------------------------------------------------------------ abonnements (Orange Money, contact admin obligatoire)
const PLAN = z.enum(["essentiel", "pro", "business"]);

async function myShopId(sb: Awaited<ReturnType<typeof requireUser>>["sb"], userId: string) {
  const { data } = await sb.from("shops").select("id").eq("owner_id", userId).neq("status", "closed").maybeSingle();
  return data?.id ?? null;
}

/** Étape 1 : le vendeur demande à payer. Il devra ensuite contacter l'admin (WhatsApp ou appel). */
const SUB_METHOD = z.enum(["orange_money", "wave", "mtn_momo", "moov_money"]);
export const requestSubscriptionPayment = action<{ plan: "essentiel" | "pro" | "business"; annual: boolean; method?: z.infer<typeof SUB_METHOD> }, string>(
  z.object({ plan: PLAN, annual: z.boolean(), method: SUB_METHOD.default("orange_money") }),
  async ({ plan, annual, method }, { user, sb }) => {
    const shopId = await myShopId(sb, user.id);
    if (!shopId) return fail("Aucune boutique active");
    const { data, error } = await sb.from("subscription_payments").insert({ shop_id: shopId, plan, annual, method }).select("ref").single();
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

// ------------------------------------------------------------------ produits du vendeur
const CATEGORIES = ["mode", "beaute", "electronique", "maison", "alimentation", "gros", "immobilier", "automobile"] as const;
const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Nom trop court").max(120),
  category: z.enum(CATEGORIES),
  subcategory: z.string().regex(/^[a-z0-9-]{2,30}$/).nullable().optional(),
  price: z.number().int().min(1, "Prix invalide").max(1_000_000_000),
  priceUnit: z.enum(["mois", "nuit", "jour"]).nullable(),
  compareAt: z.number().int().positive().nullable(),
  stock: z.number().int().min(0).max(1_000_000),
  short: z.string().trim().max(200),
  description: z.string().trim().max(5000),
  specs: z.array(z.tuple([z.string().trim().min(1).max(40), z.string().trim().min(1).max(120)])).max(20),
  wholesaleMin: z.number().int().min(2).nullable(),
  wholesalePrice: z.number().int().positive().nullable(),
  published: z.boolean(),
});

async function myApprovedShop(sb: Awaited<ReturnType<typeof requireUser>>["sb"], userId: string) {
  const { data } = await sb.from("shops").select("id, slug, status").eq("owner_id", userId).neq("status", "closed").maybeSingle();
  return data;
}

export const saveProduct = action<z.infer<typeof productSchema>, { id: string; slug: string }>(productSchema, async (p, { user, sb }) => {
  const shop = await myApprovedShop(sb, user.id);
  if (!shop || shop.status !== "approved") return fail("Votre boutique doit être autorisée pour publier des produits.");
  if (p.compareAt !== null && p.compareAt <= p.price) return fail("L'ancien prix doit être supérieur au prix actuel.");
  if ((p.wholesaleMin === null) !== (p.wholesalePrice === null)) return fail("Prix de gros : indiquez la quantité minimale ET le prix.");
  const row = {
    name: p.name, category: p.category, subcategory: p.category === "electronique" ? p.subcategory ?? null : null, price: p.price, price_unit: p.priceUnit, compare_at: p.compareAt, stock: p.stock,
    short: p.short || null, description: p.description || null, specs: p.specs, wholesale_min: p.wholesaleMin, wholesale_price: p.wholesalePrice, published: p.published,
  };
  if (p.id) {
    const { data, error } = await sb.from("products").update(row).eq("id", p.id).eq("shop_id", shop.id).select("id, slug").single();
    if (error) return dbError(error);
    revalidatePath(`/produits/${data.slug}`);
    revalidatePath("/vendeur/produits");
    return { ok: true, data };
  }
  const slug = `${slugify(p.name).slice(0, 70) || "produit"}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await sb.from("products").insert({ ...row, shop_id: shop.id, slug }).select("id, slug").single();
  if (error) return dbError(error);
  revalidatePath("/vendeur/produits");
  revalidatePath("/marketplace", "layout");
  return { ok: true, data };
});

export const deleteProduct = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { data: files } = await sb.from("product_media").select("path").eq("product_id", id);
  const { data: prod, error } = await sb.from("products").delete().eq("id", id).select("slug").single();
  if (error) return dbError(error);
  if (files?.length) await sb.storage.from("product-media").remove(files.map((f) => f.path));
  revalidatePath("/vendeur/produits");
  revalidatePath(`/produits/${prod.slug}`);
  return { ok: true };
});

/** Rafraîchit la fiche publique d'un produit après un changement de ses médias. */
async function revalidateProduct(sb: Awaited<ReturnType<typeof requireUser>>["sb"], productId: string) {
  const { data } = await sb.from("products").select("slug").eq("id", productId).maybeSingle();
  if (data) revalidatePath(`/produits/${data.slug}`);
  revalidatePath("/vendeur/produits");
  revalidatePath("/marketplace", "layout");
}

/** Enregistre un fichier déjà envoyé dans le stockage (dossier de la boutique, vérifié par la base). */
export const addProductMedia = action(
  z.object({
    productId: z.string().uuid(),
    kind: z.enum(["photo", "pano", "spin"]),
    path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-z-]{8,40}\.(webp|jpg|jpeg|png)$/, "Chemin de fichier invalide"),
    width: z.number().int().positive().max(20000),
    height: z.number().int().positive().max(20000),
    label: z.string().trim().max(40).optional(),
  }),
  async (m, { sb }) => {
    const { count } = await sb.from("product_media").select("id", { count: "exact", head: true }).eq("product_id", m.productId).eq("kind", m.kind);
    const { error } = await sb.from("product_media").insert({ product_id: m.productId, shop_id: m.path.slice(0, 36), kind: m.kind, path: m.path, width: m.width, height: m.height, label: m.label || null, position: count ?? 0 });
    if (error) {
      await sb.storage.from("product-media").remove([m.path]);
      return dbError(error);
    }
    await revalidateProduct(sb, m.productId);
    return { ok: true };
  },
);

export const deleteProductMedia = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { data, error } = await sb.from("product_media").delete().eq("id", id).select("path, product_id").single();
  if (error) return dbError(error);
  await sb.storage.from("product-media").remove([data.path]);
  await revalidateProduct(sb, data.product_id);
  return { ok: true };
});

export const updateProductMedia = action(
  z.object({ items: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0).max(99), label: z.string().trim().max(40).optional() })).max(40) }),
  async ({ items }, { sb }) => {
    let productId = "";
    for (const it of items) {
      const { data, error } = await sb.from("product_media").update({ position: it.position, ...(it.label !== undefined ? { label: it.label || null } : {}) }).eq("id", it.id).select("product_id").single();
      if (error) return dbError(error);
      productId = data.product_id;
    }
    if (productId) await revalidateProduct(sb, productId);
    return { ok: true };
  },
);

// ------------------------------------------------------------------ modifications demandées par écrit
const changesSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    short: z.string().trim().max(200),
    description: z.string().trim().max(5000),
    price: z.number().int().min(1).max(1_000_000_000),
    compareAt: z.number().int().positive().nullable(),
    specs: z.array(z.tuple([z.string().trim().min(1).max(40), z.string().trim().min(1).max(120)])).max(20),
  })
  .partial()
  .strict();

/** Le vendeur écrit ce qu'il veut changer ; le serveur prépare une proposition ; l'admin décide. */
export const requestProductEdit = action(
  z.object({ productId: z.string().uuid(), message: z.string().trim().min(5, "Décrivez la modification (5 caractères au moins)").max(1000, "1 000 caractères au maximum") }),
  async ({ productId, message }, { sb }) => {
    const { data: product } = await sb.from("products").select("shop_id, name, short, description, price, compare_at, specs, category").eq("id", productId).maybeSingle();
    if (!product) return fail("Produit introuvable");
    const { data: req, error } = await sb.from("product_edit_requests").insert({ product_id: productId, shop_id: product.shop_id, message }).select("id").single();
    if (error) return dbError(error);
    // La proposition est écrite avec la clé serveur : le vendeur ne peut pas la fabriquer lui-même.
    const { makeProposal } = await import("@/lib/edit-proposal");
    const current = {
      name: product.name, short: product.short, description: product.description, price: product.price, compareAt: product.compare_at,
      specs: Array.isArray(product.specs) ? (product.specs as [string, string][]) : [],
    };
    try {
      const { proposal, ai } = await makeProposal(message, current, product.category);
      await supabaseService().from("product_edit_requests").update({ proposal, ai }).eq("id", req.id);
    } catch (e) {
      console.error("proposition non enregistrée :", (e as Error).message);   // l'admin traitera la demande à la main
    }
    revalidatePath("/vendeur/produits");
    revalidatePath("/admin");
    return { ok: true };
  },
);

export const cancelProductEdit = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("product_edit_requests").update({ status: "cancelled" }).eq("id", id).eq("status", "review");
  if (error) return dbError(error);
  revalidatePath("/vendeur/produits");
  revalidatePath("/admin");
  return { ok: true };
});

export const adminApplyEdit = action(
  z.object({ id: z.string().uuid(), changes: changesSchema, note: z.string().trim().max(500).optional() }),
  async ({ id, changes, note }, { sb }) => {
    if (!Object.keys(changes).length) return fail("Aucun changement à appliquer : modifiez au moins un champ, ou refusez la demande.");
    const { error } = await sb.rpc("admin_apply_edit", { p_request: id, p_changes: changes, p_note: note || undefined });
    if (error) return dbError(error);
    const { data } = await sb.from("product_edit_requests").select("products(slug)").eq("id", id).single();
    const slug = (data?.products as { slug: string } | null)?.slug;
    if (slug) revalidatePath(`/produits/${slug}`);
    revalidatePath("/marketplace", "layout");
    revalidatePath("/admin");
    return { ok: true };
  },
);

export const adminRejectEdit = action(z.object({ id: z.string().uuid(), note: z.string().trim().max(500).optional() }), async ({ id, note }, { sb }) => {
  const { error } = await sb.rpc("admin_reject_edit", { p_request: id, p_note: note || undefined });
  if (error) return dbError(error);
  revalidatePath("/admin");
  return { ok: true };
});

// ------------------------------------------------------------------ accueil : pages en plus selon le compte
/** Vendeur (boutique non fermée) et/ou fondateur : rien n'est révélé aux autres visiteurs. */
export async function getHubRoles(): Promise<ActionResult<{ seller: boolean; admin: boolean; loggedIn?: boolean }>> {
  const u = await currentUser();
  if (!u) return { ok: true, data: { seller: false, admin: false, loggedIn: false } };
  const { data: shop } = await u.sb.from("shops").select("id").eq("owner_id", u.user.id).neq("status", "closed").maybeSingle();
  return { ok: true, data: { seller: !!shop, admin: u.profile?.role === "admin", loggedIn: true } };
}

// ------------------------------------------------------------------ fiche publique de la boutique (mise à jour par le vendeur)
const shopProfileSchema =
  z
    .object({
      city: z.string().trim().min(2).max(80),
      district: z.string().trim().max(80),
      isPhysical: z.boolean(),
      mapsUrl: z.string().trim().max(500).refine((v) => !v || isMapsUrl(v), "Collez un lien Google Maps (google.com/maps ou maps.app.goo.gl)"),
      whatsapp: PHONE,
      callPhone: PHONE,
      samples: z.array(sampleSchema).max(5),
    })
    .refine((f) => !f.isPhysical || f.mapsUrl, { message: "Boutique physique : collez le lien Google Maps" });

export const updateShopProfile = action(
  shopProfileSchema,
  async (f, { user, sb }) => {
    const coords = f.isPhysical ? coordsFromMapsUrl(f.mapsUrl) : null;
    const { data, error } = await sb
      .from("shops")
      .update({
        city: f.city, district: f.district || null, is_physical: f.isPhysical, maps_url: f.isPhysical ? f.mapsUrl : null,
        lat: coords?.lat ?? null, lng: coords?.lng ?? null, whatsapp: f.whatsapp, call_phone: f.callPhone, sample_prices: f.samples,
      })
      .eq("owner_id", user.id)
      .neq("status", "closed")
      .select("slug")
      .single();
    if (error) return dbError(error);
    revalidatePath(`/boutiques/${data.slug}`);
    revalidatePath("/vendeur");
    return { ok: true };
  },
);

// ------------------------------------------------------------------ réglages de l'acheteur
export const setPreferredPayment = action(z.object({ method: PAYMENT.nullable() }), async ({ method }, { user, sb }) => {
  const { error } = await sb.from("profiles").update({ preferred_payment: method }).eq("id", user.id);
  if (error) return dbError(error);
  revalidatePath("/reglages");
  return { ok: true };
});

// ------------------------------------------------------------------ essayage virtuel des vêtements
/** État de l'essayage pour le visiteur : connecté ? service prêt ? essais restants dans cette boutique (null = illimité). */
export async function tryOnStatus(shopSlug: string): Promise<{ loggedIn: boolean; ready: boolean; remaining: number | null }> {
  const { tryOnConfigured } = await import("@/lib/tryon");
  const u = await currentUser();
  if (!u) return { loggedIn: false, ready: tryOnConfigured(), remaining: null };
  const { data: shop } = await u.sb.from("shops").select("id").eq("slug", String(shopSlug).slice(0, 80)).maybeSingle();
  if (!shop) return { loggedIn: true, ready: false, remaining: 0 };
  const { data } = await u.sb.rpc("tryon_remaining", { p_shop: shop.id });
  return { loggedIn: true, ready: tryOnConfigured(), remaining: (data as number | null) ?? null };
}

const tryOnSchema = z.object({
  shopSlug: z.string().min(1).max(80),
  slugs: z.array(z.string().min(1).max(100)).min(1, "Choisissez au moins un vêtement").max(3, "3 vêtements au plus"),
  // Photo compressée sur le téléphone ; jamais enregistrée par NEXORA.
  photo: z.string().max(2_500_000, "Photo trop lourde").regex(/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/, "Photo illisible"),
});

export const tryOn = action<z.infer<typeof tryOnSchema>, { image: string; remaining: number | null }>(tryOnSchema, async ({ shopSlug, slugs, photo }, { sb }) => {
  const { generateTryOn, tryOnConfigured } = await import("@/lib/tryon");
  if (!tryOnConfigured()) return fail("L'essayage par IA arrive très bientôt. Aucun essai n'a été décompté.");
  const { data: shop } = await sb.from("shops").select("id").eq("slug", shopSlug).maybeSingle();
  if (!shop) return fail("Boutique introuvable");
  const { data: rows } = await sb
    .from("products")
    .select("id, name, short, product_media(path, kind, position)")
    .eq("shop_id", shop.id)
    .eq("category", "mode")
    .eq("published", true)
    .in("slug", slugs);
  const garments = (rows ?? [])
    .map((p) => {
      const photoPath = (p.product_media ?? []).filter((m) => m.kind === "photo").sort((a, b) => a.position - b.position)[0]?.path;
      return photoPath ? { id: p.id, imageUrl: productMediaUrl(photoPath), name: p.name, description: p.short ?? "" } : null;
    })
    .filter((g): g is NonNullable<typeof g> => !!g);
  if (garments.length !== slugs.length) return fail("Chaque vêtement choisi doit avoir une photo dans cette boutique.");
  const { data: claimId, error } = await sb.rpc("claim_tryon", { p_shop: shop.id, p_products: garments.map((g) => g.id) });
  if (error) return dbError(error);
  try {
    const res = await generateTryOn(photo, garments);
    await sb.rpc("finish_tryon", { p_id: claimId as string, p_ok: true });
    const { data: left } = await sb.rpc("tryon_remaining", { p_shop: shop.id });
    return { ok: true, data: { image: res.image, remaining: (left as number | null) ?? null } };
  } catch (e) {
    await sb.rpc("finish_tryon", { p_id: claimId as string, p_ok: false });   // l'essai raté est rendu
    console.error("essayage :", (e as Error).message);
    return fail("L'essayage n'a pas abouti. Votre essai n'est pas décompté : réessayez avec une photo de face, en pied, bien éclairée.");
  }
});

// ------------------------------------------------------------------ apparence de la boutique (Pro / Ultra)
const shopThemeSchema = z.object({
  brandColor: z.enum(["#ff5fa2", "#ff6b6b", "#ff9f43", "#e3b341", "#84cc16", "#3ad389", "#22d3ee", "#3b9eff", "#9281f7", "#e879f9"]).nullable(),
  signature: z.enum(["vague", "constellation", "ruban", "pulsation"]).nullable(),
  displayFont: z.enum(["serif", "sans", "mono"]).nullable(),
});
export const updateShopTheme = action(shopThemeSchema, async (f, { user, sb }) => {
  const { data, error } = await sb
    .from("shops")
    .update({ brand_color: f.brandColor, signature: f.signature, display_font: f.displayFont })
    .eq("owner_id", user.id)
    .neq("status", "closed")
    .select("slug")
    .single();
  if (error) return dbError(error);
  revalidatePath(`/boutiques/${data.slug}`);
  revalidatePath("/vendeur");
  return { ok: true };
});

// ------------------------------------------------------------------ Studio IA (forfait Ultra)
export type AiCreationView = { id: string; kind: "image" | "video"; prompt: string; status: "pending" | "done" | "failed"; url: string | null; published: boolean; createdAt: string };
const AI_COLS = "id, kind, prompt, status, path, published, created_at, request_id, shop_id, source_id";
type AiRow = { id: string; kind: string; prompt: string; status: string; path: string | null; published: boolean; created_at: string; request_id: string | null; shop_id: string; source_id: string | null };
const aiView = (r: AiRow): AiCreationView => ({
  id: r.id, kind: r.kind as AiCreationView["kind"], prompt: r.prompt, status: r.status as AiCreationView["status"],
  url: r.path ? aiUrl(r.path) : null, published: r.published, createdAt: r.created_at,
});

/** État du studio pour le vendeur connecté : créations, quotas restants du mois, service prêt ou non. */
export async function aiStudioState(): Promise<{ ready: boolean; remaining: { image: number; video: number }; creations: AiCreationView[] } | null> {
  const { aiConfigured } = await import("@/lib/ai-studio");
  const u = await currentUser();
  if (!u) return null;
  const [img, vid, list] = await Promise.all([
    u.sb.rpc("ai_remaining", { p_kind: "image" }),
    u.sb.rpc("ai_remaining", { p_kind: "video" }),
    u.sb.from("ai_creations").select(AI_COLS).order("created_at", { ascending: false }).limit(40),
  ]);
  return { ready: aiConfigured(), remaining: { image: (img.data as number) ?? 0, video: (vid.data as number) ?? 0 }, creations: ((list.data ?? []) as AiRow[]).map(aiView) };
}

const aiCreateSchema = z.object({
  kind: z.enum(["image", "video"]),
  prompt: z.string().trim().min(3, "Décrivez ce que vous voulez (3 caractères au moins)").max(600, "600 caractères au plus"),
  sourceId: z.string().uuid().nullable(),
});

export const createAiCreation = action<z.infer<typeof aiCreateSchema>, { id: string }>(aiCreateSchema, async ({ kind, prompt, sourceId }, { sb }) => {
  const { aiConfigured, submitAi } = await import("@/lib/ai-studio");
  if (!aiConfigured()) return fail("Le Studio IA arrive très bientôt. Rien n'a été décompté.");
  if (kind === "video" && !sourceId) return fail("Choisissez l'image à animer (créez d'abord une image).");
  const { data: id, error } = await sb.rpc("claim_ai_creation", { p_kind: kind, p_prompt: prompt, ...(sourceId ? { p_source: sourceId } : {}) });
  if (error) return dbError(error);
  const svc = supabaseService();
  try {
    let sourceUrl: string | undefined;
    if (sourceId) {
      const { data: src } = await sb.from("ai_creations").select("path").eq("id", sourceId).maybeSingle();
      sourceUrl = src?.path ? aiUrl(src.path) : undefined;
    }
    const requestId = await submitAi(kind, prompt, sourceUrl);
    await svc.from("ai_creations").update({ request_id: requestId }).eq("id", id as string);
    return { ok: true, data: { id: id as string } };
  } catch (e) {
    await svc.from("ai_creations").update({ status: "failed" }).eq("id", id as string);   // rendue : ne compte pas
    console.error("studio IA :", (e as Error).message);
    return fail("La création n'a pas pu démarrer. Rien n'a été décompté : réessayez dans un instant.");
  }
});

const aiIdSchema = z.object({ id: z.string().uuid() });

/** Suivi d'une création : quand elle est prête, le fichier est rapatrié chez NEXORA (les liens du service expirent). */
export const pollAiCreation = action<z.infer<typeof aiIdSchema>, AiCreationView>(aiIdSchema, async ({ id }, { sb }) => {
  const { data: row } = await sb.from("ai_creations").select(AI_COLS).eq("id", id).maybeSingle();   // RLS : ses créations seulement
  if (!row) return fail("Création introuvable");
  const r = row as AiRow;
  if (r.status !== "pending" || !r.request_id) return { ok: true, data: aiView(r) };
  const { checkAi, downloadAi } = await import("@/lib/ai-studio");
  const svc = supabaseService();
  const failNow = async () => {
    await svc.from("ai_creations").update({ status: "failed" }).eq("id", id).eq("status", "pending");
    return { ok: true as const, data: aiView({ ...r, status: "failed" }) };
  };
  if (Date.now() - new Date(r.created_at).getTime() > 20 * 60_000) return failNow();
  try {
    const res = await checkAi(r.kind as "image" | "video", r.request_id);
    if (res.status === "pending") return { ok: true, data: aiView(r) };
    if (res.status === "failed") { console.error("studio IA :", res.reason); return failNow(); }
    const file = res.data ? { data: res.data, contentType: res.contentType } : await downloadAi(res.url!);
    const video = r.kind === "video";
    const path = `${r.shop_id}/${id}.${video ? "mp4" : file.contentType === "image/png" ? "png" : file.contentType === "image/webp" ? "webp" : "jpg"}`;
    const up = await svc.storage.from("shop-ai").upload(path, file.data, { contentType: video ? "video/mp4" : file.contentType, upsert: true });
    if (up.error) throw up.error;
    const { data: done } = await svc.from("ai_creations").update({ status: "done", path }).eq("id", id).eq("status", "pending").select(AI_COLS).single();
    return { ok: true, data: aiView((done ?? { ...r, status: "done", path }) as AiRow) };
  } catch (e) {
    console.error("studio IA :", (e as Error).message);
    return { ok: true, data: aiView(r) };   // on réessaiera au prochain passage
  }
});

const aiPublishSchema = z.object({ id: z.string().uuid(), published: z.boolean() });
export const publishAiCreation = action(aiPublishSchema, async ({ id, published }, { user, sb }) => {
  const { error } = await sb.rpc("set_ai_published", { p_id: id, p_published: published });
  if (error) return dbError(error);
  const { data: shop } = await sb.from("shops").select("slug").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
  if (shop) revalidatePath(`/boutiques/${shop.slug}`);
  return { ok: true };
});

// ------------------------------------------------------------------ lien de la boutique
const shopSlugSchema = z.object({
  slug: z.string().trim().toLowerCase().min(3, "3 caractères au moins").max(40, "40 caractères au plus")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lettres minuscules, chiffres et tirets seulement (ex. bazin-bamako)"),
});
/** Le vendeur choisit l'adresse de sa boutique ; l'ancienne continue de mener à la boutique. */
export const setShopSlug = action<z.infer<typeof shopSlugSchema>, { slug: string }>(shopSlugSchema, async ({ slug }, { user, sb }) => {
  const { data: before } = await sb.from("shops").select("slug").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
  const { data, error } = await sb.rpc("set_shop_slug", { p_slug: slug });
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  if (before?.slug) revalidatePath(`/boutiques/${before.slug}`);   // l'ancienne page en cache laisse place à la redirection
  revalidatePath(`/boutiques/${data as string}`);
  return { ok: true, data: { slug: data as string } };
});

// ------------------------------------------------------------------ connexion par mot de passe (avec blocage de l'appareil)
const passwordLoginSchema = z.object({ email: z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(200), password: z.string().min(1).max(200) });
export type PasswordLoginResult = { ok: true; mfa?: boolean } | { ok: false; error: string; blocked?: boolean };

/**
 * Connexion e-mail + mot de passe, faite par le serveur pour appliquer la règle :
 * une seule erreur de mot de passe ⇒ cet appareil ne peut plus se connecter à ce compte
 * (sauf en prouvant qu'il en est le propriétaire avec le lien « Mot de passe oublié »).
 */
export async function passwordLogin(raw: unknown): Promise<PasswordLoginResult> {
  const parsed = passwordLoginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const { email, password } = parsed.data;
  const { deviceId, isBlocked, block, ipLocked, recordFailure } = await import("@/lib/login-guard");
  const device = (await deviceId())!;
  const blockedMsg = "Cet appareil est bloqué pour ce compte après une erreur de mot de passe. Pour le débloquer, touchez « Mot de passe oublié » et ouvrez le lien reçu sur cet appareil.";
  try {
    if (await isBlocked(device, email)) return { ok: false, error: blockedMsg, blocked: true };
    if (await ipLocked()) return { ok: false, error: "Trop d'erreurs de mot de passe depuis cette connexion internet. Réessayez dans une heure." };
  } catch (e) {
    console.error("blocage :", (e as Error).message);
    return { ok: false, error: "Connexion momentanément indisponible. Réessayez dans un instant." };
  }
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (!error) {
    // Double vérification activée sur ce compte : il faut encore le code à 6 chiffres de l'application.
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    return { ok: true, mfa: aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2" };
  }
  if (error.status === 429) return { ok: false, error: "Trop d'essais. Patientez une minute." };
  if (/confirm/i.test(error.message)) return { ok: false, error: "Confirmez d'abord votre adresse : touchez le lien reçu par e-mail lors de l'inscription." };
  if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
    await block(device, email).catch((e) => console.error("blocage :", (e as Error).message));
    await recordFailure().catch((e) => console.error("tentative :", (e as Error).message));
    return { ok: false, error: "Mot de passe incorrect. Par sécurité, cet appareil ne peut plus se connecter à ce compte. Pour le débloquer, utilisez « Mot de passe oublié ».", blocked: true };
  }
  return { ok: false, error: "Connexion impossible pour le moment. Réessayez." };
}

// ------------------------------------------------------------------ commentaires des boutiques
export type ShopCommentView = { id: string; author: string; body: string; rating: number | null; reply: string | null; hidden: boolean; date: string; mine: boolean };

/** Commentaires d'une boutique (lus à chaque visite, hors cache) et ce que le visiteur peut faire. */
export async function getShopComments(slug: string): Promise<{ comments: ShopCommentView[]; viewer: { loggedIn: boolean; isOwner: boolean; isAdmin: boolean } }> {
  const u = await currentUser();
  const sb = u?.sb ?? (await supabaseServer());
  const { data: shop } = await sb.from("shops").select("id, owner_id").eq("slug", slug).maybeSingle();
  const viewer = { loggedIn: !!u, isOwner: !!u && shop?.owner_id === u.user.id, isAdmin: u?.profile?.role === "admin" };
  if (!shop) return { comments: [], viewer };
  const { data } = await sb.from("shop_comments").select("id, author_id, author_name, body, rating, seller_reply, hidden, created_at").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(100);
  return {
    viewer,
    comments: (data ?? []).map((c) => ({ id: c.id, author: c.author_name, body: c.body, rating: c.rating, reply: c.seller_reply, hidden: c.hidden, date: c.created_at.slice(0, 10), mine: !!u && c.author_id === u.user.id })),
  };
}

export const addShopComment = action(
  z.object({ slug: z.string().min(1).max(90), body: z.string().trim().min(3, "Écrivez au moins quelques mots").max(800), rating: z.number().int().min(1).max(5).nullable() }),
  async ({ slug, body, rating }, { user, sb }) => {
    const { data: shop } = await sb.from("shops").select("id, owner_id").eq("slug", slug).eq("status", "approved").maybeSingle();
    if (!shop) return fail("Boutique introuvable");
    if (shop.owner_id === user.id) return fail("Vous ne pouvez pas commenter votre propre boutique.");
    const { error } = await sb.from("shop_comments").insert({ shop_id: shop.id, author_id: user.id, author_name: "-", body, rating });
    if (error) return fail(/Trop de commentaires/.test(error.message) ? "Vous avez déjà commenté 3 fois aujourd'hui. Revenez demain." : "Commentaire impossible pour le moment.");
    return { ok: true };
  },
);

export const replyShopComment = action(z.object({ id: z.string().uuid(), reply: z.string().trim().max(800) }), async ({ id, reply }, { sb }) => {
  const { error } = await sb.rpc("reply_shop_comment", { p_comment: id, p_reply: reply });
  return error ? dbError(error) : { ok: true };
});

export const deleteShopComment = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("shop_comments").delete().eq("id", id);
  return error ? dbError(error) : { ok: true };
});

export const hideShopComment = action(z.object({ id: z.string().uuid(), hidden: z.boolean() }), async ({ id, hidden }, { sb }) => {
  const { error } = await sb.rpc("admin_hide_shop_comment", { p_comment: id, p_hidden: hidden });
  return error ? dbError(error) : { ok: true };
});

// ------------------------------------------------------------------ paiement d'une commande
export type OrderPayInfo = { shopName: string; method: string; total: number; payNumber: string | null; payType: string | null; whatsapp: string | null };

/** Après la commande : où envoyer l'argent (numéro Orange Money / Wave du vendeur), visible du seul acheteur. */
export async function getOrderPayInfo(ref: string): Promise<OrderPayInfo | null> {
  const u = await currentUser();
  if (!u || !/^[A-Z0-9-]{4,40}$/i.test(ref)) return null;
  const { data } = await u.sb.rpc("order_pay_info", { p_ref: ref });
  const r = data?.[0];
  return r ? { shopName: r.shop_name, method: r.method, total: r.total, payNumber: r.pay_number, payType: r.pay_type, whatsapp: r.whatsapp } : null;
}

/** Carte bancaire : ouvre la page de paiement sécurisée de PayDunya, pour le montant exact calculé par la base. */
export async function payOrderByCard(ref: string): Promise<ActionResult<string>> {
  const u = await currentUser();
  if (!u) return fail("Connectez-vous pour payer.", true);
  const { data: o } = await u.sb.from("orders").select("ref, total, method, status, product_name, shop_name")
    .eq("ref", ref).eq("buyer_id", u.user.id).maybeSingle();
  if (!o || o.method !== "card") return fail("Commande introuvable");
  if (o.status !== "pending_payment") return fail("Cette commande est déjà payée.");
  const { headers } = await import("next/headers");
  const h = await headers();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const { startCardPayment } = await import("@/lib/card-payment");
  const r = await startCardPayment({
    ref: o.ref, amount: o.total, description: `${o.product_name ?? "Commande"} - ${o.shop_name ?? "NEXORA"} (réf. ${o.ref})`,
    returnUrl: `${base}/compte?paiement=${encodeURIComponent(o.ref)}`, cancelUrl: `${base}/compte?paiement-annule=${encodeURIComponent(o.ref)}`,
    notifyUrl: `${base}/api/paiement/carte`, siteUrl: base,
  });
  return r.ok ? { ok: true, data: r.url } : fail(r.error);
}

/** Le paiement par carte est-il branché ? (pour l'afficher comme disponible ou « bientôt »). */
export async function cardPaymentStatus(): Promise<boolean> {
  const { cardPaymentReady } = await import("@/lib/card-payment");
  return cardPaymentReady();
}

// ------------------------------------------------------------------ ventes hors site et demandes WhatsApp
const SALE_CHANNEL = z.enum(["whatsapp", "telephone", "boutique", "autre"]);

/** Le vendeur note une vente faite par WhatsApp, au téléphone ou en boutique : elle compte dans son tableau de bord. */
export const addManualSale = action(
  z.object({
    productId: z.string().uuid().nullable(),
    label: z.string().trim().min(2, "Indiquez ce qui a été vendu").max(120),
    qty: z.number().int().min(1).max(100000),
    amount: z.number().int().min(0).max(1_000_000_000),
    channel: SALE_CHANNEL,
    customerName: z.string().trim().max(80),
    customerPhone: z.string().trim().regex(/^$|^[+0-9 ]{6,30}$/, "Numéro du client invalide"),
    soldOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  async (f, { user, sb }) => {
    const { data: shop } = await sb.from("shops").select("id").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
    if (!shop) return fail("Aucune boutique active");
    if (f.soldOn > new Date().toISOString().slice(0, 10)) return fail("La date de vente ne peut pas être dans le futur.");
    const { error } = await sb.from("manual_sales").insert({
      shop_id: shop.id, product_id: f.productId, label: f.label, qty: f.qty, amount: f.amount, channel: f.channel,
      customer_name: f.customerName || null, customer_phone: f.customerPhone || null, sold_on: f.soldOn,
    });
    if (error) return dbError(error);
    revalidatePath("/vendeur");
    return { ok: true };
  },
);

export const deleteManualSale = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("manual_sales").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

/** Un client touche « Commander sur WhatsApp » : la demande est comptée pour le vendeur (aucune donnée du client). */
export async function logWhatsAppLead(shopSlug: string, productSlug?: string): Promise<void> {
  if (!/^[a-z0-9-]{2,90}$/.test(shopSlug) || (productSlug && !/^[a-z0-9-]{2,90}$/.test(productSlug))) return;
  try { await supabaseService().rpc("log_whatsapp_lead", { p_shop_slug: shopSlug, p_product_slug: productSlug }); } catch { /* compteur seulement */ }
}

// ------------------------------------------------------------------ zones et frais de livraison du vendeur
export const addDeliveryZone = action(
  z.object({ name: z.string().trim().min(2, "Nom de la zone trop court").max(60), fee: z.number().int().min(0).max(1_000_000), delay: z.string().trim().max(40) }),
  async ({ name, fee, delay }, { user, sb }) => {
    const { data: shop } = await sb.from("shops").select("id, slug").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
    if (!shop) return fail("Aucune boutique active");
    const { count } = await sb.from("shop_delivery_zones").select("id", { count: "exact", head: true }).eq("shop_id", shop.id);
    const { error } = await sb.from("shop_delivery_zones").insert({ shop_id: shop.id, name, fee, delay: delay || null, position: count ?? 0 });
    if (error) return dbError(error);
    revalidatePath("/vendeur");
    revalidatePath(`/boutiques/${shop.slug}`);
    revalidatePath("/produits/[slug]", "page");
    return { ok: true };
  },
);

export const deleteDeliveryZone = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("shop_delivery_zones").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  revalidatePath("/produits/[slug]", "page");
  return { ok: true };
});

/** Zones de la boutique du vendeur connecté (espace vendeur). */
export async function myDeliveryZones(): Promise<{ id: string; name: string; fee: number; delay: string | null }[]> {
  const u = await currentUser();
  if (!u) return [];
  const { data: shop } = await u.sb.from("shops").select("id").eq("owner_id", u.user.id).neq("status", "closed").maybeSingle();
  if (!shop) return [];
  const { data } = await u.sb.from("shop_delivery_zones").select("id, name, fee, delay").eq("shop_id", shop.id).order("position").order("created_at");
  return data ?? [];
}

/** Badge « Vendeur vérifié » : l'admin le donne après contrôle de la pièce d'identité, ou le retire. */
export const adminSetVerified = action(z.object({ shopId: z.string().uuid(), verified: z.boolean() }), async ({ shopId, verified }, { sb }) => {
  const { error } = await sb.rpc("admin_set_verified", { p_shop: shopId, p_verified: verified });
  if (error) return dbError(error);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: true };
});

// ------------------------------------------------------------------ paiement à la livraison : confirmation, livreurs, argent
/** Le client confirme sa commande depuis le lien reçu sur WhatsApp (sans compte). */
export async function confirmOrderByToken(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{20,64}$/.test(token)) return false;
  const { data } = await (await supabaseServer()).rpc("confirm_order_by_token", { p_token: token });
  return !!data;
}

/** Le livreur marque la commande livrée (argent encaissé) ou refusée par le client, depuis son lien. */
export async function courierReport(token: string, outcome: "delivered" | "refused"): Promise<boolean> {
  if (!/^[a-f0-9]{20,64}$/.test(token) || !["delivered", "refused"].includes(outcome)) return false;
  const { data } = await (await supabaseServer()).rpc("courier_report", { p_token: token, p_outcome: outcome });
  return !!data;
}

export const addCourier = action(
  z.object({ name: z.string().trim().min(2, "Nom du livreur trop court").max(60), phone: PHONE }),
  async ({ name, phone }, { user, sb }) => {
    const { data: shop } = await sb.from("shops").select("id").eq("owner_id", user.id).neq("status", "closed").maybeSingle();
    if (!shop) return fail("Aucune boutique active");
    const { error } = await sb.from("shop_couriers").insert({ shop_id: shop.id, name, phone });
    if (error) return dbError(error);
    revalidatePath("/vendeur");
    return { ok: true };
  },
);

export const deleteCourier = action(z.object({ id: z.string().uuid() }), async ({ id }, { sb }) => {
  const { error } = await sb.from("shop_couriers").delete().eq("id", id);
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

/** Attribue une commande à un livreur ; renvoie le jeton du lien personnel du livreur. */
export const assignCourier = action<{ orderId: string; courierId: string | null }, string | null>(
  z.object({ orderId: z.string().uuid(), courierId: z.string().uuid().nullable() }),
  async ({ orderId, courierId }, { sb }) => {
    const { data, error } = await sb.rpc("assign_courier", { p_order: orderId, p_courier: courierId });
    if (error) return dbError(error);
    revalidatePath("/vendeur");
    return { ok: true, data: data ?? null };
  },
);

/** Le livreur a remis au vendeur l'argent encaissé. */
export const settleCash = action(z.object({ orderId: z.string().uuid() }), async ({ orderId }, { sb }) => {
  const { error } = await sb.rpc("settle_cash", { p_order: orderId });
  if (error) return dbError(error);
  revalidatePath("/vendeur");
  return { ok: true };
});

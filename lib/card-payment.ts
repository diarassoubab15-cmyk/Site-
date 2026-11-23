import "server-only";
/**
 * Paiement par carte (Visa, Mastercard…) via la page sécurisée de CinetPay, prestataire agréé en Afrique de l'Ouest.
 * Le client ne saisit jamais sa carte sur NEXORA : il est envoyé sur la page de CinetPay puis revient.
 * Actif seulement si CINETPAY_APIKEY et CINETPAY_SITE_ID sont définis (variables secrètes du serveur, sur Vercel).
 */
const API = "https://api-checkout.cinetpay.com/v2";

export const cardPaymentReady = () => !!(process.env.CINETPAY_APIKEY && process.env.CINETPAY_SITE_ID);

export async function startCardPayment(o: {
  ref: string; amount: number; description: string; returnUrl: string; notifyUrl: string;
  customer: { name: string; phone: string; city: string; email?: string; country?: string };
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!cardPaymentReady()) return { ok: false, error: "Le paiement par carte sera bientôt disponible. Choisissez Orange Money, Wave ou le paiement à la livraison." };
  const [first, ...rest] = o.customer.name.trim().split(/\s+/);
  try {
    const res = await fetch(`${API}/payment`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_APIKEY, site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: o.ref, amount: Math.ceil(o.amount / 5) * 5, currency: "XOF", description: o.description.replace(/[^\p{L}\p{N} .,'-]/gu, " ").slice(0, 120),
        notify_url: o.notifyUrl, return_url: o.returnUrl, channels: "CREDIT_CARD", lang: "fr",
        customer_name: rest.join(" ") || first, customer_surname: first, customer_email: o.customer.email || "client@nexora.africa",
        customer_phone_number: o.customer.phone.replace(/\s/g, ""), customer_address: o.customer.city, customer_city: o.customer.city,
        customer_country: o.customer.country ?? "ML", customer_state: o.customer.country ?? "ML", customer_zip_code: "00000",
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await res.json()) as { code?: string; message?: string; data?: { payment_url?: string } };
    if (json.code === "201" && json.data?.payment_url) return { ok: true, url: json.data.payment_url };
    console.error("CinetPay : création refusée", json.code, json.message);
    return { ok: false, error: "Paiement par carte indisponible pour le moment. Réessayez ou choisissez un autre moyen." };
  } catch (e) {
    console.error("CinetPay injoignable", (e as Error).message);
    return { ok: false, error: "Paiement par carte indisponible pour le moment. Réessayez dans un instant." };
  }
}

/** Statut réel d'un paiement, demandé à CinetPay (on ne croit jamais le navigateur). */
export async function checkCardPayment(ref: string): Promise<"ACCEPTED" | "REFUSED" | "PENDING" | null> {
  if (!cardPaymentReady()) return null;
  try {
    const res = await fetch(`${API}/payment/check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apikey: process.env.CINETPAY_APIKEY, site_id: process.env.CINETPAY_SITE_ID, transaction_id: ref }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json()) as { data?: { status?: string } };
    const st = json.data?.status;
    return st === "ACCEPTED" || st === "REFUSED" ? st : "PENDING";
  } catch { return null; }
}

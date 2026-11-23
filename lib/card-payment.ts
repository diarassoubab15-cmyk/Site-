import "server-only";
/**
 * Paiement par carte (Visa, Mastercard) via la page sécurisée de PayDunya, prestataire présent au Mali.
 * Le client ne saisit jamais sa carte sur NEXORA : il est envoyé sur la page de PayDunya puis revient.
 *
 * Variables secrètes du serveur (Vercel → Settings → Environment Variables, cochées « Sensitive ») :
 *   PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN
 *   PAYDUNYA_MODE = "test" pour essayer sans argent réel (par défaut : réel)
 */
const base = () => (process.env.PAYDUNYA_MODE === "test" ? "https://app.paydunya.com/sandbox-api/v1" : "https://app.paydunya.com/api/v1");
const headers = () => ({
  "content-type": "application/json",
  "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY ?? "",
  "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY ?? "",
  "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN ?? "",
});

export const cardPaymentReady = () => !!(process.env.PAYDUNYA_MASTER_KEY && process.env.PAYDUNYA_PRIVATE_KEY && process.env.PAYDUNYA_TOKEN);

export async function startCardPayment(o: {
  ref: string; amount: number; description: string; returnUrl: string; cancelUrl: string; notifyUrl: string; siteUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!cardPaymentReady()) return { ok: false, error: "Le paiement par carte sera bientôt disponible. Choisissez Orange Money, Wave ou le paiement à la livraison." };
  try {
    const res = await fetch(`${base()}/checkout-invoice/create`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        invoice: { total_amount: o.amount, description: o.description.slice(0, 200), channels: ["card"] },
        store: { name: "NEXORA", website_url: o.siteUrl },
        actions: { return_url: o.returnUrl, cancel_url: o.cancelUrl, callback_url: o.notifyUrl },
        custom_data: { ref: o.ref },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await res.json()) as { response_code?: string; response_text?: string };
    if (json.response_code === "00" && json.response_text?.startsWith("https://")) return { ok: true, url: json.response_text };
    console.error("PayDunya : création refusée", json.response_code, json.response_text);
    return { ok: false, error: "Paiement par carte indisponible pour le moment. Réessayez ou choisissez un autre moyen." };
  } catch (e) {
    console.error("PayDunya injoignable", (e as Error).message);
    return { ok: false, error: "Paiement par carte indisponible pour le moment. Réessayez dans un instant." };
  }
}

/** Statut réel d'un paiement, redemandé à PayDunya avec le jeton de la facture (on ne croit jamais le navigateur). */
export async function confirmCardPayment(token: string): Promise<{ status: string; ref: string | null; amount: number } | null> {
  if (!cardPaymentReady() || !/^[A-Za-z0-9_-]{6,80}$/.test(token)) return null;
  try {
    const res = await fetch(`${base()}/checkout-invoice/confirm/${token}`, { headers: headers(), signal: AbortSignal.timeout(15_000) });
    const json = (await res.json()) as { response_code?: string; status?: string; custom_data?: { ref?: string }; invoice?: { total_amount?: number | string } };
    if (json.response_code !== "00") return null;
    return { status: json.status ?? "pending", ref: json.custom_data?.ref ?? null, amount: Number(json.invoice?.total_amount ?? 0) };
  } catch { return null; }
}

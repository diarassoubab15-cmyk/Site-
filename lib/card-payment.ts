import "server-only";
/**
 * Paiement par carte (Visa, Mastercard) via la page sécurisée de FedaPay, prestataire qui couvre le Mali.
 * Le client ne saisit jamais sa carte sur NEXORA : il est envoyé sur la page de FedaPay puis revient.
 *
 * Variables secrètes du serveur (Vercel → Settings → Environment Variables, cochées « Sensitive ») :
 *   FEDAPAY_SECRET_KEY   clé secrète du compte marchand (sk_live_… ou sk_sandbox_…)
 *   FEDAPAY_MODE = "test" pour essayer sans argent réel avec la clé sk_sandbox_… (par défaut : réel)
 */
const base = () => (process.env.FEDAPAY_MODE === "test" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1");
const headers = () => ({ "content-type": "application/json", authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY ?? ""}` });

export const cardPaymentReady = () => !!process.env.FEDAPAY_SECRET_KEY;

type FedaTx = { id: number; status: string; amount: number; merchant_reference?: string | null; custom_metadata?: { ref?: string } | null };
// FedaPay renvoie l'objet sous la clé « v1/transaction ».
const txOf = (json: Record<string, unknown>) => (json["v1/transaction"] ?? json.transaction) as FedaTx | undefined;

/** Lien de paiement d'une transaction existante (nouveau jeton, même transaction : jamais de second débit). */
async function linkFor(txId: number | string): Promise<string | null> {
  const tok = await fetch(`${base()}/transactions/${txId}/token`, { method: "POST", headers: headers(), body: "{}", signal: AbortSignal.timeout(20_000) });
  const t = (await tok.json().catch(() => ({}))) as { url?: string };
  return tok.ok && t.url?.startsWith("https://") ? t.url : null;
}

/**
 * Ouvre le paiement par carte d'une commande. Si une transaction existe déjà pour cette commande
 * (client qui revient, page rechargée, double toucher), on la REPREND au lieu d'en créer une seconde :
 * c'est ce qui évite le double débit reproché à d'autres plateformes.
 */
export async function startCardPayment(o: { ref: string; amount: number; description: string; returnUrl: string; existingTxId?: string | null }):
  Promise<{ ok: true; url: string; txId: string } | { ok: false; error: string; alreadyPaid?: boolean }> {
  if (!cardPaymentReady()) return { ok: false, error: "Le paiement par carte sera bientôt disponible. Choisissez Orange Money, Wave ou le paiement à la livraison." };
  try {
    if (o.existingTxId) {
      const prev = await confirmCardPayment(o.existingTxId);
      if (prev?.status === "completed") return { ok: false, error: "Cette commande est déjà payée.", alreadyPaid: true };
      if (prev && ["pending", "created"].includes(prev.status)) {
        const url = await linkFor(o.existingTxId);
        if (url) return { ok: true, url, txId: o.existingTxId };
      }
      // Transaction annulée, refusée ou expirée : on en ouvre une nouvelle (rien n'a été débité).
    }
    const res = await fetch(`${base()}/transactions`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        description: o.description.slice(0, 200),
        amount: o.amount,
        currency: { iso: "XOF" },
        callback_url: o.returnUrl,
        // Référence unique par tentative (la commande reste dans custom_metadata.ref).
        merchant_reference: `${o.ref}-${Date.now().toString(36)}`,
        custom_metadata: { ref: o.ref },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const tx = txOf(await res.json());
    if (!res.ok || !tx?.id) {
      console.error("FedaPay : création refusée", res.status);
      return { ok: false, error: "Paiement par carte indisponible pour le moment. Réessayez ou choisissez un autre moyen." };
    }
    const url = await linkFor(tx.id);
    if (url) return { ok: true, url, txId: String(tx.id) };
    console.error("FedaPay : lien de paiement refusé");
    return { ok: false, error: "Paiement par carte indisponible pour le moment. Réessayez dans un instant." };
  } catch (e) {
    console.error("FedaPay injoignable", (e as Error).message);
    return { ok: false, error: "Paiement par carte indisponible pour le moment. Réessayez dans un instant." };
  }
}

/** Statut réel d'une transaction, redemandé à FedaPay avec son numéro (on ne croit jamais le navigateur). */
export async function confirmCardPayment(id: string): Promise<{ status: string; ref: string | null; amount: number } | null> {
  if (!cardPaymentReady() || !/^[0-9]{1,15}$/.test(id)) return null;
  try {
    const res = await fetch(`${base()}/transactions/${id}`, { headers: headers(), signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const tx = txOf(await res.json());
    if (!tx) return null;
    // « approved » = payé (FedaPay considère aussi « transferred » comme payé).
    const paid = ["approved", "transferred", "approved_partially_refunded", "transferred_partially_refunded"].includes(tx.status);
    return { status: paid ? "completed" : tx.status, ref: tx.custom_metadata?.ref ?? tx.merchant_reference?.replace(/-[a-z0-9]+$/, "") ?? null, amount: Number(tx.amount ?? 0) };
  } catch { return null; }
}

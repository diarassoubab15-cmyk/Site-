import "server-only";
import { confirmCardPayment } from "./card-payment";
import { supabaseService } from "./supabase/server";

/**
 * Valide une commande payée par carte : statut « completed » chez PayDunya, montant identique au total
 * calculé par la base, commande encore en attente de paiement. Appelé par la notification et au retour du client.
 */
export async function settleCardPayment(token: string): Promise<"paid" | "pending" | "invalid"> {
  const c = await confirmCardPayment(token);
  if (!c?.ref) return "invalid";
  if (c.status !== "completed") return "pending";
  const sb = supabaseService();
  const { data: order } = await sb.from("orders").select("id, total, status, method").eq("ref", c.ref).maybeSingle();
  if (!order || order.method !== "card") return "invalid";
  if (order.status !== "pending_payment") return "paid";
  if (c.amount < order.total) {
    console.error("PayDunya : montant inférieur au total de la commande", c.ref);
    return "invalid";
  }
  await sb.from("orders").update({ status: "confirmed" }).eq("id", order.id).eq("status", "pending_payment");
  return "paid";
}

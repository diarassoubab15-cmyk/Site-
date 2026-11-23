import { NextResponse } from "next/server";
import { checkCardPayment } from "@/lib/card-payment";
import { supabaseService } from "@/lib/supabase/server";

/**
 * Notification de CinetPay après un paiement par carte. Le contenu reçu n'est jamais cru tel quel :
 * on redemande le statut à CinetPay, puis la commande passe à « confirmée » si le paiement est accepté.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const ref = String(form?.get("cpm_trans_id") ?? "").slice(0, 40);
  if (!/^[A-Z0-9-]{4,40}$/i.test(ref)) return NextResponse.json({ ok: false }, { status: 400 });
  const status = await checkCardPayment(ref);
  if (status === "ACCEPTED") {
    await supabaseService().from("orders").update({ status: "confirmed" }).eq("ref", ref).eq("method", "card").eq("status", "pending_payment");
  }
  return NextResponse.json({ ok: true });
}

// CinetPay vérifie que l'adresse répond avant d'envoyer les notifications.
export function GET() {
  return NextResponse.json({ ok: true });
}

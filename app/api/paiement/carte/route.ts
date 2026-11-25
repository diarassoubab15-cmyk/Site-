import { NextResponse } from "next/server";
import { settleCardPayment } from "@/lib/card-settle";

/**
 * Webhook FedaPay (à déclarer dans le tableau de bord FedaPay → Webhooks : https://<site>/api/paiement/carte).
 * Le contenu reçu n'est jamais cru tel quel : seul le numéro de transaction sert, et le statut est redemandé à FedaPay.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { entity?: { id?: number | string } } | null;
  const id = String(body?.entity?.id ?? "");
  if (!/^[0-9]{1,15}$/.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  await settleCardPayment(id);
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true });
}

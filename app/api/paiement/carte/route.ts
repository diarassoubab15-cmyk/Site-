import { NextResponse } from "next/server";
import { settleCardPayment } from "@/lib/card-settle";

/**
 * Notification de PayDunya après un paiement par carte (formulaire « data[invoice][token]… »).
 * Le contenu reçu n'est jamais cru tel quel : seul le jeton sert, et le statut est redemandé à PayDunya.
 */
export async function POST(req: Request) {
  let token = "";
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("json")) {
    const body = (await req.json().catch(() => null)) as { data?: { invoice?: { token?: string } } } | null;
    token = body?.data?.invoice?.token ?? "";
  } else {
    const form = await req.formData().catch(() => null);
    token = String(form?.get("data[invoice][token]") ?? "");
  }
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  await settleCardPayment(token);
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true });
}

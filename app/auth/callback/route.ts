import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

const OTP_TYPES = new Set(["email", "magiclink", "signup", "invite", "recovery", "email_change"]);

/**
 * Retour d'un lien de connexion (e-mail) ou de Google : ouvre la session puis envoie vers `next`.
 *  - ?code=…               : lien standard (même navigateur que la demande) ;
 *  - ?token_hash=…&type=…  : lien qui marche aussi depuis un autre appareil (modèle d'e-mail Supabase adapté).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const next = q.get("next") ?? "/compte";
  // N'accepte que les redirections internes (évite les redirections vers un site piège).
  const safeNext = next.startsWith("/") && !next.startsWith("//") && next !== "/" ? next : "/compte";
  const sb = await supabaseServer();
  const code = q.get("code");
  const tokenHash = q.get("token_hash");
  const type = q.get("type") ?? "email";
  let ok = false;
  if (code) ok = !(await sb.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && OTP_TYPES.has(type)) ok = !(await sb.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType })).error;
  if (ok) {
    // Inscription confirmée : on recopie le nom saisi dans le profil s'il est encore vide.
    const { data } = await sb.auth.getUser();
    const fullName = (data.user?.user_metadata as { full_name?: string } | undefined)?.full_name?.trim();
    if (data.user && fullName) await sb.from("profiles").update({ full_name: fullName.slice(0, 120) }).eq("id", data.user.id).is("full_name", null);
    // Lien reçu par e-mail = preuve que c'est le propriétaire : on débloque cet appareil pour ce compte.
    if (data.user?.email) {
      const { deviceId, unblock } = await import("@/lib/login-guard");
      const device = await deviceId(false);
      if (device) await unblock(device, data.user.email).catch((e) => console.error("déblocage :", (e as Error).message));
    }
    return NextResponse.redirect(new URL(safeNext, req.url));
  }
  return NextResponse.redirect(new URL(`/connexion?erreur=lien&next=${encodeURIComponent(safeNext)}`, req.url));
}

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Retour de Google (ou d'un lien e-mail) : échange le code contre une session. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/compte";
  // N'accepte que les redirections internes (évite les redirections vers un site piège).
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, req.url));
  }
  return NextResponse.redirect(new URL("/connexion?erreur=lien", req.url));
}

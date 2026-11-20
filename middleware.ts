import { NextResponse, type NextRequest } from "next/server";

/**
 * Verrou de l'espace /admin.
 * - En attendant Supabase : protection par identifiant + mot de passe (ADMIN_USER / ADMIN_PASSWORD).
 * - En production, si ces variables manquent, /admin est fermé (aucun accès possible par défaut).
 * - Après branchement de Supabase : remplacer par la vérification du rôle « admin » (voir README).
 */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");

  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") return new NextResponse("Administration non configurée.", { status: 404 });
    return res; // développement local
  }

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, ...rest] = Buffer.from(encoded, "base64").toString("utf8").split(":");
    if (safeEqual(u, user) && safeEqual(rest.join(":"), pass)) return res;
  }
  return new NextResponse("Authentification requise.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="NEXORA admin", charset="UTF-8"' } });
}

// Runtime Node.js : lit ADMIN_USER / ADMIN_PASSWORD au démarrage du serveur (et non au build).
export const config = { matcher: ["/admin/:path*"], runtime: "nodejs" };

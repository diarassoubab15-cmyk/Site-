import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseEnabled } from "@/lib/supabase/env";

/**
 * - Rafraîchit la session Supabase à chaque visite.
 * - /compte et /vendeur : connexion obligatoire.
 * - /admin : uniquement le compte dont le rôle est « admin » (un seul possible, imposé par la base).
 *   Les autres reçoivent une 404 : l'existence de la page n'est même pas révélée.
 * Sans Supabase (mode démo), /admin est protégé par ADMIN_USER / ADMIN_PASSWORD
 * et fermé en production si ces variables manquent.
 */
const PRIVATE = ["/compte", "/vendeur", "/admin"];

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const notFound = () => new NextResponse("Page introuvable.", { status: 404, headers: { "X-Robots-Tag": "noindex" } });

function basicAuth(req: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return process.env.NODE_ENV === "production" ? notFound() : null;
  const [scheme, encoded] = (req.headers.get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, ...rest] = Buffer.from(encoded, "base64").toString("utf8").split(":");
    if (safeEqual(u, user) && safeEqual(rest.join(":"), pass)) return null;
  }
  return new NextResponse("Authentification requise.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="NEXORA admin", charset="UTF-8"' } });
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPrivate = PRIVATE.some((p) => path === p || path.startsWith(`${p}/`));

  if (!supabaseEnabled) {
    if (path.startsWith("/admin")) {
      const block = basicAuth(req);
      if (block) return block;
    }
    const res = NextResponse.next();
    if (isPrivate) res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  let res = NextResponse.next({ request: req });
  const sb = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await sb.auth.getUser();

  if (isPrivate) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (!data.user) {
      if (path.startsWith("/admin")) return notFound();
      const url = req.nextUrl.clone();
      url.pathname = "/connexion";
      url.search = `?next=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/admin")) {
      const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).single();
      if (profile?.role !== "admin") return notFound();
    }
  }
  return res;
}

export const config = {
  // Toutes les pages sauf fichiers statiques et images.
  matcher: ["/((?!_next/static|_next/image|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)"],
  runtime: "nodejs",
};

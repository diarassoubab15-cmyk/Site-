import type { Metadata } from "next";
import { DemoNotice } from "@/components/DemoNotice";
import { LoginForm, type AuthMode } from "@/components/LoginForm";
import { supabaseEnabled } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Se connecter ou s'inscrire", robots: { index: false, follow: true }, alternates: { canonical: "/connexion" } };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string; mode?: string }> }) {
  const { next, erreur, mode } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
  const initialMode: AuthMode = mode === "inscription" ? "inscription" : "connexion";
  const u = supabaseEnabled ? await currentUser() : null;
  return (
    <section className="container-x max-w-md py-12 sm:py-16">
      <h1 className="h-section text-4xl sm:text-5xl">{initialMode === "inscription" ? "Créer un compte" : "Bienvenue"}</h1>
      <p className="mb-8 mt-4 text-ash">Connectez-vous ou créez votre compte NEXORA avec votre e-mail et un mot de passe.</p>
      {!supabaseEnabled && <DemoNotice>n&apos;importe quel mot de passe de 8 caractères est accepté.</DemoNotice>}
      {erreur && (
        <p className="mb-6 rounded-[18px] border border-alarm/40 bg-black px-4 py-3 text-sm text-alarm" role="alert">
          Ce lien n&apos;a pas pu être utilisé (expiré, ou ouvert dans un autre navigateur que celui de la demande). Connectez-vous avec votre mot de passe, ou redemandez un lien depuis ce navigateur.
        </p>
      )}
      <LoginForm next={safeNext} initialMode={initialMode} user={u ? { email: u.user.email ?? "", phone: u.user.phone ?? "" } : null} />
    </section>
  );
}

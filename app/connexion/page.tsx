import type { Metadata } from "next";
import { DemoNotice } from "@/components/DemoNotice";
import { LoginForm } from "@/components/LoginForm";
import { supabaseEnabled } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: true }, alternates: { canonical: "/connexion" } };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const { next, erreur } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
  const u = supabaseEnabled ? await currentUser() : null;
  return (
    <section className="container-x max-w-md py-16 sm:py-24">
      <h1 className="h-section text-4xl sm:text-5xl">Connexion</h1>
      <p className="mb-8 mt-4 text-ash">Un code, et c&apos;est tout. Le même formulaire sert à créer votre compte.</p>
      {!supabaseEnabled && <DemoNotice>n&apos;importe quel code à 6 chiffres est accepté.</DemoNotice>}
      {erreur && <p className="mb-6 rounded-[6px] border border-alarm/40 px-3 py-2 text-sm text-alarm">Ce lien de connexion a expiré. Demandez un nouveau code.</p>}
      <LoginForm next={safeNext} user={u ? { email: u.user.email ?? "", phone: u.user.phone ?? "" } : null} />
    </section>
  );
}

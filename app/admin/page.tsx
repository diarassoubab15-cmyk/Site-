import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminView } from "@/components/AdminView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadAdmin } from "@/lib/server-data";
import { DemoNotice } from "@/components/DemoNotice";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false, nocache: true } };

export const dynamic = "force-dynamic";

export default async function Admin() {
  const live = supabaseEnabled ? await loadAdmin() : null;
  // Double vérification pas encore activée : rappel bien visible (elle protège tout le site).
  const aal = supabaseEnabled ? (await (await supabaseServer()).auth.mfa.getAuthenticatorAssuranceLevel()).data : null;
  const noMfa = !!aal && aal.nextLevel !== "aal2";
  // Double verrou : le middleware filtre déjà, la page revérifie le rôle.
  if (supabaseEnabled && !live) notFound();
  return (
    <section className="container-x py-16">
      <p className="eyebrow">Accès réservé à l&apos;administrateur</p>
      <h1 className="h-section mb-8 mt-4 text-4xl sm:text-5xl">Tableau de bord</h1>
      <DemoNotice />
      {noMfa && (
        <p className="mb-6 rounded-[18px] bg-[#fff6e5] px-4 py-3 text-sm text-[#8a5a00]" role="alert">
          Votre compte administrateur n&apos;a pas encore la double vérification. <Link href="/compte/securite" className="font-medium underline underline-offset-4">Activez-la maintenant</Link> : sans elle, un mot de passe volé suffirait pour prendre le contrôle du site.
        </p>
      )}
      <AdminView live={live} />
    </section>
  );
}

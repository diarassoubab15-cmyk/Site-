import Link from "next/link";
import type { Metadata } from "next";
import { AccountView } from "@/components/AccountView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadAccount } from "@/lib/server-data";
import { currentUser } from "@/lib/supabase/server";
import { DemoNotice } from "@/components/DemoNotice";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function Compte({ searchParams }: { searchParams: Promise<{ paiement?: string }> }) {
  const { paiement } = await searchParams;
  const live = supabaseEnabled ? await loadAccount() : null;
  const isAdmin = supabaseEnabled && (await currentUser())?.profile?.role === "admin";
  return (
    <section className="container-x py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-section text-4xl sm:text-5xl">Mon compte</h1>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <Link href="/admin" className="btn-solid">Espace administrateur</Link>}
          {supabaseEnabled && <Link href="/compte/securite" className="btn">Sécurité du compte</Link>}
        </div>
      </div>
      <DemoNotice />
      {paiement && (
        <p className="mb-6 rounded-[18px] bg-[#e9f8ef] px-4 py-3 text-sm text-[#0f6b3f]" role="status">
          Retour du paiement par carte pour la commande <span className="font-mono">{paiement.slice(0, 40)}</span> : dès que la banque confirme (en général moins d&apos;une minute), la commande passe à « confirmée » ci-dessous.
        </p>
      )}
      <AccountView live={live} />
    </section>
  );
}

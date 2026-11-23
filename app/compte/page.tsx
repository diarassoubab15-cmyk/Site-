import Link from "next/link";
import type { Metadata } from "next";
import { AccountView } from "@/components/AccountView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadAccount } from "@/lib/server-data";
import { currentUser } from "@/lib/supabase/server";
import { DemoNotice } from "@/components/DemoNotice";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function Compte({ searchParams }: { searchParams: Promise<{ paiement?: string; token?: string; "paiement-annule"?: string }> }) {
  const sp = await searchParams;
  const paiement = sp.paiement;
  // Retour de PayDunya (?token=…) : on vérifie tout de suite auprès de PayDunya, sans attendre la notification.
  const settled = paiement && sp.token ? await (await import("@/lib/card-settle")).settleCardPayment(sp.token) : null;
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
        <p className={`mb-6 rounded-[18px] px-4 py-3 text-sm ${settled === "invalid" ? "bg-[#fdecec] text-alarm" : "bg-[#e9f8ef] text-[#0f6b3f]"}`} role="status">
          {settled === "paid"
            ? <>Paiement par carte reçu pour la commande <span className="font-mono">{paiement.slice(0, 40)}</span>. Merci ! Le vendeur prépare votre colis.</>
            : settled === "invalid"
              ? <>Le paiement de la commande <span className="font-mono">{paiement.slice(0, 40)}</span> n&apos;a pas pu être vérifié. Si votre carte a été débitée, contactez le service client.</>
              : <>Paiement de la commande <span className="font-mono">{paiement.slice(0, 40)}</span> en cours de vérification : la commande passera à « confirmée » dans un instant.</>}
        </p>
      )}
      {sp["paiement-annule"] && (
        <p className="mb-6 rounded-[18px] bg-[#fff6e5] px-4 py-3 text-sm text-[#8a5a00]" role="status">
          Paiement annulé : rien n&apos;a été débité. Votre commande <span className="font-mono">{sp["paiement-annule"].slice(0, 40)}</span> vous attend ; vous pouvez la payer plus tard ou choisir un autre moyen.
        </p>
      )}
      <AccountView live={live} />
    </section>
  );
}

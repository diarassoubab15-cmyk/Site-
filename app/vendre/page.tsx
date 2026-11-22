import type { Metadata } from "next";
import { SellerApplyForm } from "@/components/SellerApplyForm";
import { SellerStory } from "@/components/SellerStory";
import { plans } from "@/lib/plans";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadKnownUser } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Créer ma boutique : vendre en ligne en Afrique",
  description: "Ouvrez votre boutique sur NEXORA : vendeurs vérifiés, paiement Mobile Money encaissé directement, paiement à la livraison et 0 % de commission.",
  alternates: { canonical: "/vendre" },
};

const how = [
  ["Création", "Nom, quelques prix, adresse, WhatsApp : 5 étapes courtes. Le brouillon se sauvegarde tout seul."],
  ["Vérification", "L'administrateur vérifie votre identité et votre activité sous 24 à 48 h."],
  ["Abonnement", "Une fois autorisé, vous contactez l'administrateur sur WhatsApp ou par téléphone, puis vous réglez votre forfait par Orange Money."],
  ["Ventes", "Vos clients paient : l'argent arrive directement sur votre compte."],
];

export default async function Vendre({ searchParams }: { searchParams: Promise<{ forfait?: string }> }) {
  const { forfait } = await searchParams;
  const initialPlan = plans.some((p) => p.id === forfait) ? forfait! : "pro";
  const known = supabaseEnabled ? await loadKnownUser() : null;
  return (
    <>
      <section className="container-x py-16 sm:py-24" style={{ ["--c" as string]: "#12995a" }}>
        <h1 className="h-display fade-up" style={{ color: "#12995a" }}>Créer ma boutique</h1>
        <p className="fade-up mt-6 max-w-2xl text-lg text-ash" style={{ ["--d" as string]: 1 }}>Ouvrez votre boutique en quelques minutes et gardez 100 % de vos ventes.</p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {how.map(([t, b], i) => (
            <li key={t} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[#12995a]/50 font-mono text-xs text-[#12995a]">{i + 1}</span>
              <span><span className="block font-medium text-white">{t}</span><span className="mt-1 block text-sm text-ash">{b}</span></span>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <SellerApplyForm initialPlan={initialPlan} known={known} />
        </div>
      </section>
      <SellerStory />
    </>
  );
}

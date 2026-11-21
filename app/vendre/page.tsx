import type { Metadata } from "next";
import { SellerApplyForm } from "@/components/SellerApplyForm";
import { plans } from "@/lib/plans";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadKnownUser } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Vendre en ligne en Afrique : ouvrir sa boutique",
  description: "Ouvrez votre boutique sur NEXORA : vendeurs vérifiés, paiement Mobile Money encaissé directement, paiement à la livraison et 0 % de commission.",
  alternates: { canonical: "/vendre" },
};

const how = [
  ["Demande", "Vous décrivez votre boutique en 4 étapes courtes. Le brouillon se sauvegarde tout seul."],
  ["Vérification", "L'administrateur vérifie votre identité et votre activité sous 24 à 48 h."],
  ["Abonnement", "Une fois autorisé, vous contactez l'administrateur sur WhatsApp ou par téléphone, puis vous réglez votre forfait par Orange Money."],
  ["Ventes", "Vos clients paient : l'argent arrive directement sur votre compte."],
];

export default async function Vendre({ searchParams }: { searchParams: Promise<{ forfait?: string }> }) {
  const { forfait } = await searchParams;
  const initialPlan = plans.some((p) => p.id === forfait) ? forfait! : "pro";
  const known = supabaseEnabled ? await loadKnownUser() : null;
  return (
    <section className="container-x grid gap-16 py-16 sm:py-24 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="eyebrow">Devenir vendeur</p>
        <h1 className="h-section mt-4">Ouvrez votre boutique. Gardez 100 % de vos ventes.</h1>
        <ol className="mt-12 space-y-8">
          {how.map(([t, b], i) => (
            <li key={t} className="flex gap-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-line font-mono text-xs text-iris">{i + 1}</span>
              <span><span className="block font-medium text-white">{t}</span><span className="mt-1 block text-sm text-ash">{b}</span></span>
            </li>
          ))}
        </ol>
      </div>
      <SellerApplyForm initialPlan={initialPlan} known={known} />
    </section>
  );
}

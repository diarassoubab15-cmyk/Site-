import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PaymentMethods } from "@/components/PaymentMethods";
import { PricingTable } from "@/components/PricingTable";
import { onlineMethods } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Tarifs vendeurs : dès 4 900 FCFA/mois, 0 % de commission",
  description: "Trois forfaits simples pour vendre en ligne en Afrique. Sans commission sur les ventes, payables en Orange Money, Wave, MTN MoMo, Moov ou carte. Résiliable en un clic.",
  alternates: { canonical: "/tarifs" },
};

const faq = [
  { q: "Prenez-vous une commission sur mes ventes ?", a: "Non. Vous payez uniquement votre abonnement. Le paiement de vos clients arrive directement sur votre compte Mobile Money ou bancaire." },
  { q: "Comment payer mon abonnement ?", a: "Par Orange Money, Wave, MTN MoMo, Moov Money ou carte bancaire. Vous recevez une facture par e-mail à chaque paiement." },
  { q: "Pourquoi n'y a-t-il pas de forfait gratuit ?", a: "Chaque boutique est vérifiée à la main par l'administrateur. Un abonnement, même modeste, éloigne les faux vendeurs et finance un SAV humain." },
  { q: "Puis-je arrêter quand je veux ?", a: "Oui, sans engagement. En fermant votre boutique, vous supprimez aussi vos cartes et comptes de paiement enregistrés : aucun prélèvement ne continue." },
  { q: "Que se passe-t-il si ma demande d'ouverture est refusée ?", a: "Vous n'êtes pas prélevé. L'abonnement ne démarre qu'après l'autorisation de votre boutique par l'administrateur." },
];

export default function Tarifs() {
  return (
    <section className="container-x py-16 sm:py-24">
      <p className="eyebrow">Tarifs</p>
      <h1 className="h-section mt-4 max-w-3xl">Un prix fixe. Zéro commission.</h1>
      <p className="mb-12 mt-6 max-w-2xl text-lg text-ash">
        Trois forfaits pensés pour les vendeurs africains. L&apos;abonnement ne démarre qu&apos;une fois votre boutique autorisée.
      </p>
      <PricingTable />
      <div className="mt-10 flex flex-col gap-4 rounded-[16px] border border-line p-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-ash">Payez votre abonnement avec</p>
        <PaymentMethods methods={onlineMethods} />
      </div>

      <section className="mt-24 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="mb-8 text-2xl font-medium text-white">Questions fréquentes</h2>
        <div className="divide-y divide-line border-y border-line">
          {faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-white [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="font-mono text-iron transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-ash">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </section>
  );
}

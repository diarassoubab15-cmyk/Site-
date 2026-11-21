import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PaymentMethods } from "@/components/PaymentMethods";
import { PricingTable } from "@/components/PricingTable";

export const metadata: Metadata = {
  title: "Tarifs vendeurs : Base, Pro et Ultra, dès 15 000 FCFA/mois, 0 % de commission",
  description: "Base 15 000, Pro 25 000 et Ultra 50 000 FCFA par mois pour vendre en ligne en Afrique. Sans commission, payables en Orange Money, Wave, MTN MoMo ou Moov Money. Sans engagement.",
  alternates: { canonical: "/tarifs" },
};

const faq = [
  { q: "Prenez-vous une commission sur mes ventes ?", a: "Non. Vous payez uniquement votre abonnement. Le paiement de vos clients arrive directement sur votre compte Mobile Money ou bancaire." },
  { q: "Comment payer mon abonnement ?", a: "Par Orange Money, Wave, MTN MoMo ou Moov Money. Depuis « Ma boutique », vous choisissez votre opérateur et contactez d'abord l'administrateur sur WhatsApp ou par téléphone ; il vous communique ensuite le numéro où envoyer le paiement. Cet échange est obligatoire : il protège contre les arnaques et les erreurs de numéro." },
  { q: "Que veut dire « bientôt » dans un forfait ?", a: "La fonction est en préparation. Elle s'ajoutera à votre forfait sans supplément dès sa sortie ; en attendant, vous ne la payez pas plus cher." },
  { q: "Pourquoi n'y a-t-il pas de forfait gratuit ?", a: "Chaque boutique est vérifiée à la main par l'administrateur. Un abonnement, même modeste, éloigne les faux vendeurs et finance un SAV humain." },
  { q: "Puis-je arrêter quand je veux ?", a: "Oui, sans engagement. Il n'y a aucun prélèvement automatique : vous payez chaque mois (ou chaque année) seulement si vous voulez continuer. En fermant votre boutique, vous supprimez aussi vos comptes de paiement enregistrés." },
  { q: "Que se passe-t-il si ma demande d'ouverture est refusée ?", a: "Vous n'avez rien payé : le paiement n'est possible qu'après l'autorisation de votre boutique par l'administrateur." },
  { q: "Quand ma boutique devient-elle visible ?", a: "Dès que l'administrateur a reçu votre paiement Orange Money. Si l'abonnement n'est pas renouvelé à l'échéance, la boutique est masquée jusqu'au paiement suivant, sans rien perdre." },
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
        <p className="text-sm text-ash">Payez votre abonnement par Mobile Money, après un échange avec l&apos;administrateur sur WhatsApp ou par téléphone.</p>
        <PaymentMethods methods={["orange_money", "wave", "mtn_momo", "moov_money"]} />
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

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales", alternates: { canonical: "/conditions" } };

export default function Conditions() {
  return (
    <article className="container-x max-w-3xl space-y-6 py-16 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-white [&_p]:text-ash">
      <h1 className="h-section text-4xl sm:text-5xl">Conditions générales</h1>
      <p className="font-mono text-xs text-amber">Modèle à faire relire par un juriste avant la mise en ligne.</p>
      <h2>Rôle de NEXORA</h2>
      <p>NEXORA met en relation acheteurs et vendeurs vérifiés. Le contrat de vente est conclu entre l&apos;acheteur et le vendeur, qui encaisse directement le paiement.</p>
      <h2>Vendeurs</h2>
      <p>Chaque boutique doit être autorisée par l&apos;administrateur avant de vendre. Elle peut être suspendue en cas de fraude, de non-livraison ou de refus de rembourser.</p>
      <h2>Abonnements</h2>
      <p>Trois forfaits payants, sans engagement ni commission sur les ventes, réglés par Orange Money. Le paiement n&apos;est possible qu&apos;après l&apos;autorisation de la boutique et un échange préalable avec l&apos;administrateur (WhatsApp ou téléphone). La boutique est visible pendant la période payée ; sans renouvellement, elle est masquée jusqu&apos;au paiement suivant. Aucun prélèvement automatique.</p>
      <h2>Protection acheteur</h2>
      <p>En cas de produit non reçu, l&apos;acheteur ouvre un litige sous 30 jours. Le vendeur dispose de 72 h pour rembourser ou prouver la livraison ; à défaut, l&apos;administrateur peut exiger le remboursement et suspendre le vendeur.</p>
      <h2>Paiement à la livraison</h2>
      <p>Lorsque le vendeur l&apos;accepte, l&apos;acheteur règle en espèces ou en Mobile Money au moment de la remise du colis.</p>
    </article>
  );
}

import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/confidentialite" } };

export default function Confidentialite() {
  return (
    <article className="container-x max-w-3xl space-y-6 py-16 text-bone [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-white [&_p]:text-ash">
      <h1 className="h-section text-4xl sm:text-5xl">Confidentialité</h1>
      <p className="font-mono text-xs text-amber">Modèle à faire relire par un juriste avant la mise en ligne.</p>
      <h2>Données collectées</h2>
      <p>Nom, e-mail ou téléphone, adresse de livraison, historique de commandes et d&apos;échanges avec le SAV. Pour les vendeurs : pièce d&apos;identité (vérification) et les 4 derniers chiffres des comptes d&apos;encaissement.</p>
      <h2>Ce que nous ne collectons pas</h2>
      <p>Numéros de carte complets, codes secrets Mobile Money, mots de passe. Ils sont traités uniquement par les opérateurs de paiement.</p>
      <h2>Utilisation</h2>
      <p>Traiter les commandes, vérifier les vendeurs, répondre au SAV et envoyer les e-mails que vous avez choisi de recevoir. Aucune revente de données.</p>
      <h2>Vos droits</h2>
      <p>Accès, export, rectification et suppression depuis votre compte, ou par e-mail à {site.support.email}.</p>
    </article>
  );
}

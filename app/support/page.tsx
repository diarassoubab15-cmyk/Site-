import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SupportForm } from "@/components/SupportForm";
import { site } from "@/lib/site";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadKnownUser } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Aide & SAV : une vraie personne répond en moins de 2 h",
  description: "Contactez le service client NEXORA par WhatsApp, e-mail ou formulaire. Signalez un vendeur, demandez un remboursement pour un produit non reçu.",
  alternates: { canonical: "/support" },
};

const protection = [
  ["Signalez", "Produit non reçu ou non conforme ? Ouvrez une demande depuis votre compte ou ce formulaire, dans les 30 jours."],
  ["72 h pour le vendeur", "Le vendeur doit vous rembourser directement ou prouver la livraison."],
  ["L'administrateur tranche", "Sans réponse, l'administrateur décide : remboursement exigé et suspension du vendeur fautif."],
];

const faq = [
  { q: "Pourquoi le remboursement vient-il du vendeur et pas de NEXORA ?", a: "Votre paiement va directement au vendeur : c'est lui qui rembourse. NEXORA contrôle le délai et peut suspendre sa boutique s'il refuse. Pour éviter tout risque, choisissez le paiement à la livraison." },
  { q: "Combien de temps pour une réponse ?", a: `Moins de ${site.support.firstResponse} en moyenne, ${site.support.hours}.` },
  { q: "Comment contacter directement l'administrateur ?", a: "Choisissez « Signaler un vendeur » ou « Produit non reçu » : ces demandes vont directement à l'administrateur, sans passer par un robot." },
];

export default async function Support({ searchParams }: { searchParams: Promise<{ boutique?: string }> }) {
  const { boutique } = await searchParams;
  const known = supabaseEnabled ? await loadKnownUser() : null;
  const wa = `https://wa.me/${site.support.whatsapp.replace(/\D/g, "")}`;
  return (
    <section className="container-x py-16 sm:py-24">
      <p className="eyebrow">Aide & SAV</p>
      <h1 className="h-section mt-4 max-w-3xl">Un problème ? Une vraie personne vous répond.</h1>
      <p className="mt-6 max-w-2xl text-lg text-ash">Pas de robot, pas de labyrinthe. Choisissez le canal qui vous arrange, {site.support.hours}.</p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="card transition-colors hover:border-iron">
          <span className="badge text-pulse">le plus rapide</span>
          <span className="mt-5 block text-lg font-medium text-white">WhatsApp</span>
          <span className="mt-1 block font-mono text-sm text-iris">{site.support.phoneDisplay}</span>
        </a>
        <a href={`mailto:${site.support.email}`} className="card transition-colors hover:border-iron">
          <span className="badge">e-mail</span>
          <span className="mt-5 block text-lg font-medium text-white">Écrire au SAV</span>
          <span className="mt-1 block font-mono text-sm text-iris">{site.support.email}</span>
        </a>
        <a href="#contact" className="card transition-colors hover:border-iron">
          <span className="badge">formulaire</span>
          <span className="mt-5 block text-lg font-medium text-white">Contacter l&apos;administrateur</span>
          <span className="mt-1 block text-sm text-ash">Signalement, litige, remboursement</span>
        </a>
      </div>

      <div className="mt-24 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div id="remboursement" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-white">Protection acheteur</h2>
          <ol className="mt-8 space-y-6">
            {protection.map(([t, b], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-line font-mono text-xs text-iris">{i + 1}</span>
                <span><span className="block text-white">{t}</span><span className="mt-1 block text-sm text-ash">{b}</span></span>
              </li>
            ))}
          </ol>
          <div className="mt-12 divide-y divide-line border-y border-line">
            {faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none justify-between gap-4 text-sm text-white [&::-webkit-details-marker]:hidden">{f.q}<span className="text-iron group-open:rotate-45" aria-hidden="true">+</span></summary>
                <p className="mt-2 text-sm text-ash">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div id="contact" className="scroll-mt-24">
          <span id="signaler" className="block scroll-mt-24" />
          <SupportForm shop={boutique} known={known} />
        </div>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </section>
  );
}

import Link from "next/link";

/** Les engagements de NEXORA, le suivi de commande et les témoignages (sur « Créer ma boutique »). */
const promises = [
  {
    tag: "0 %",
    title: "Aucune commission sur vos ventes",
    body: "Vous payez un abonnement fixe, c'est tout. Pas de frais cachés par transaction, même si votre client paie en Mobile Money.",
  },
  {
    tag: "direct",
    title: "L'argent va directement au vendeur",
    body: "Le paiement du client arrive sur le compte Orange Money, Wave ou bancaire du vendeur. NEXORA ne garde jamais votre argent.",
  },
  {
    tag: "vérifié",
    title: "Chaque vendeur est validé à la main",
    body: "Une boutique n'apparaît qu'après vérification par l'administrateur. Elle peut être suspendue à tout moment en cas d'abus.",
  },
  {
    tag: "livraison",
    title: "Payez à la livraison si vous préférez",
    body: "Pas confiance ? Réglez en espèces ou en Mobile Money en main propre, à la réception du colis.",
  },
  {
    tag: "humain",
    title: "Un SAV qu'on arrive à joindre",
    body: "WhatsApp, e-mail ou formulaire : une vraie personne répond en moins de 2 heures, 7 jours sur 7.",
  },
  {
    tag: "1 clic",
    title: "Partir sans laisser de traces",
    body: "En fermant votre boutique, vous supprimez vos cartes et comptes Mobile Money associés. Aucun prélèvement ne continue.",
  },
];

const timeline = [
  { t: "09:14", dot: "bg-sky", label: "commande.créée", detail: "#NX-20418 · Robe wax Sanaa · 18 500 FCFA" },
  { t: "09:14", dot: "bg-iris-glow", label: "paiement.choisi", detail: "à la livraison (espèces / Mobile Money)" },
  { t: "09:31", dot: "bg-iris-glow", label: "vendeur.confirme", detail: "Atelier Kenté · Abidjan" },
  { t: "11:02", dot: "bg-amber", label: "colis.expédié", detail: "livreur assigné · suivi par SMS" },
  { t: "16:45", dot: "bg-pulse", label: "colis.livré", detail: "payé au livreur → reçu par le vendeur" },
  { t: "16:46", dot: "bg-pulse", label: "avis.demandé", detail: "un seul e-mail · désactivable" },
];

const testimonials = [
  { quote: "Je recevais mes paiements avec trois jours de retard sur d'autres plateformes. Ici, le Wave arrive sur mon téléphone dès que le client paie.", name: "Fatimata O.", role: "Karité de Koudougou" },
  { quote: "Le paiement à la livraison a changé mes ventes : mes clients n'avaient pas confiance pour payer en avance un vendeur inconnu.", name: "Koffi A.", role: "Atelier Kenté, Abidjan" },
  { quote: "Un colis n'est jamais arrivé. J'ai signalé le vendeur, le SAV m'a répondu sur WhatsApp en 40 minutes et j'ai été remboursée.", name: "Nadège T.", role: "Cliente à Douala" },
];

export function SellerStory() {
  return (
    <>
      {/* PROMESSES */}
      <section className="container-x py-24" aria-labelledby="promesses">
        <p className="eyebrow">Ce qui change</p>
        <h2 id="promesses" className="h-section mt-4 max-w-3xl">Les défauts des grandes plateformes, corrigés.</h2>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal suppressHydrationWarning>
          {promises.map((p) => (
            <article key={p.title} className="card">
              <span className="badge text-iris-glow">{p.tag}</span>
              <h3 className="mt-5 text-lg font-medium text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* SUIVI DE COMMANDE (fenêtre terminal) */}
      <section className="container-x grid items-center gap-12 py-12 lg:grid-cols-2" aria-labelledby="suivi">
        <div>
          <p className="eyebrow">Transparence</p>
          <h2 id="suivi" className="h-section mt-4">Chaque commande, suivie à la minute.</h2>
          <p className="mt-6 max-w-md text-ash">
            Le client et le vendeur voient le même historique. En cas de litige, l&apos;administrateur dispose de toutes les preuves pour
            trancher vite.
          </p>
          <Link href="/support#remboursement" className="mt-8 inline-flex items-center gap-1 text-white hover:underline">
            Comment fonctionne la protection acheteur <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="overflow-hidden rounded-[16px] border border-line">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-charcoal" />
            <span className="h-2.5 w-2.5 rounded-full bg-charcoal" />
            <span className="h-2.5 w-2.5 rounded-full bg-charcoal" />
            <span className="ml-3 font-mono text-xs text-iron">commande NX-20418</span>
          </div>
          <ol className="space-y-3 p-5 font-mono text-[13px] leading-relaxed" data-reveal suppressHydrationWarning>
            {timeline.map((e, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-charcoal">{e.t}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${e.dot}`} aria-hidden="true" />
                <span className="text-iris">{e.label}</span>
                <span className="text-ash">{e.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="container-x py-24" aria-labelledby="avis">
        <p className="eyebrow">Avis</p>
        <h2 id="avis" className="h-section mt-4">Ils vendent et achètent sur NEXORA.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3" data-reveal suppressHydrationWarning>
          {testimonials.map((t) => (
            <figure key={t.name} className="card flex flex-col justify-between gap-8 p-6">
              <blockquote className="text-bone">« {t.quote} »</blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-xs text-white" aria-hidden="true">
                  {t.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-medium text-bone">{t.name}</span>
                  <span className="block text-sm text-ash">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

    </>
  );
}

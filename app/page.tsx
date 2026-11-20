import Link from "next/link";
import { Hero3D } from "@/components/Hero3D";
import { ProductCard } from "@/components/ProductCard";
import { PaymentMethods } from "@/components/PaymentMethods";
import { categories } from "@/lib/data";
import { listCards } from "@/lib/catalog";
import { onlineMethods } from "@/lib/payments";

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

export const revalidate = 60;

export default async function Home() {
  const featured = await listCards({ inStock: true, limit: 8 });
  return (
    <>
      {/* HERO */}
      <section className="container-x grid items-center gap-12 pb-24 pt-16 sm:pt-24 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <Link href="/securite" className="pill fade-up hover:border-white" style={{ ["--d" as string]: 1 }}>
            <span className="h-1.5 w-1.5 rounded-full bg-pulse" aria-hidden="true" />
            Chaque vendeur est vérifié avant de vendre
            <span className="text-iris-glow" aria-hidden="true">›</span>
          </Link>
          <h1 className="h-display fade-up mt-8" style={{ ["--d" as string]: 2 }}>
            Vendez partout en Afrique.
            <br />
            <em className="text-ash">Encaissez directement.</em>
          </h1>
          <p className="fade-up mt-8 max-w-xl text-lg leading-relaxed text-ash" style={{ ["--d" as string]: 3 }}>
            NEXORA est la marketplace où le client paie en Orange Money, Wave, carte ou à la livraison, et où le vendeur reçoit son argent
            sans intermédiaire ni commission.
          </p>
          <div className="fade-up mt-10 flex flex-wrap gap-3" style={{ ["--d" as string]: 4 }}>
            <Link href="/marketplace" className="btn-solid">Découvrir les produits</Link>
            <Link href="/vendre" className="btn">Ouvrir ma boutique <span aria-hidden="true">›</span></Link>
          </div>
        </div>
        <div className="fade-up hidden justify-center lg:flex" style={{ ["--d" as string]: 3 }}>
          <Hero3D size={260} />
        </div>
      </section>

      {/* MOYENS DE PAIEMENT */}
      <section aria-labelledby="paiements" className="border-y border-line">
        <div className="container-x flex flex-col items-start justify-between gap-5 py-8 md:flex-row md:items-center">
          <h2 id="paiements" className="text-sm text-ash">Moyens de paiement acceptés sur toute la marketplace</h2>
          <PaymentMethods methods={[...onlineMethods, "cash_on_delivery"]} />
        </div>
      </section>

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

      {/* CATÉGORIES */}
      <section className="container-x py-24" aria-labelledby="categories">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="categories" className="h-section">Parcourir</h2>
          <Link href="/marketplace" className="text-sm text-bone hover:text-white">Tout voir ›</Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal suppressHydrationWarning>
          {categories.map((c) => (
            <Link key={c.slug} href={`/marketplace/${c.slug}`} className="card lift group flex items-start gap-5 hover:border-iron">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-xl text-white" style={{ background: "linear-gradient(to right bottom, #9281f7, #9a54dc)" }} aria-hidden="true">
                {c.icon}
              </span>
              <span>
                <span className="block font-medium text-white">{c.name}</span>
                <span className="mt-1 block text-sm text-ash">{c.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUITS */}
      <section className="container-x py-12" aria-labelledby="selection">
        <h2 id="selection" className="h-section">Sélection du moment</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" data-reveal suppressHydrationWarning>
          {featured.map((c) => (
            <ProductCard key={c.product.slug} item={c} />
          ))}
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

      {/* CTA */}
      <section className="container-x">
        <div className="rounded-[24px] border border-line px-6 py-16 text-center sm:px-16" style={{ background: "linear-gradient(rgb(27,27,27), rgb(3,3,3))" }}>
          <h2 className="font-display text-4xl leading-none text-white sm:text-[77px]">Votre boutique, ce soir.</h2>
          <p className="mx-auto mt-6 max-w-lg text-ash">À partir de 4 900 FCFA par mois, sans commission. Payable en Orange Money, Wave ou carte.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/vendre" className="btn-solid">Demander mon ouverture</Link>
            <Link href="/tarifs" className="btn">Voir les tarifs</Link>
          </div>
        </div>
      </section>
    </>
  );
}

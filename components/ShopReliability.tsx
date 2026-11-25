import type { Reliability } from "@/lib/catalog";

/**
 * « Fiabilité du vendeur » : expédie à temps, commandes livrées, litiges, réponses aux commentaires.
 * Calculée automatiquement sur 6 mois ; en dessous de 3 commandes, on l'annonce comme nouveau vendeur.
 */
export function ShopReliability({ r }: { r: Reliability }) {
  if (r.orders < 3) {
    return <p className="rounded-[18px] bg-lift px-4 py-3 text-sm text-ash">🌱 Nouveau vendeur sur NEXORA : sa note de fiabilité apparaîtra après ses premières commandes. Le paiement à la livraison vous protège.</p>;
  }
  const tone = (v: number | null, good = 90, ok = 75) => (v === null ? "text-ash" : v >= good ? "text-pulse" : v >= ok ? "text-amber" : "text-alarm");
  const items: [string, string, string][] = [
    ["Expédie à temps", r.onTimePct === null ? "—" : `${r.onTimePct} %`, tone(r.onTimePct)],
    ["Commandes livrées", r.deliveredPct === null ? "—" : `${r.deliveredPct} %`, tone(r.deliveredPct)],
    ["Litiges (6 mois)", String(r.disputes), r.disputes === 0 ? "text-pulse" : r.disputes <= 2 ? "text-amber" : "text-alarm"],
    ["Répond aux commentaires", r.replyPct === null ? "—" : `${r.replyPct} %`, tone(r.replyPct, 70, 40)],
  ];
  return (
    <section aria-labelledby="fiabilite" className="rounded-[18px] border border-line p-4">
      <h2 id="fiabilite" className="text-sm font-medium text-white">Fiabilité du vendeur <span className="font-normal text-iron">· {r.orders} commandes sur 6 mois, calculé par NEXORA</span></h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(([k, v, c]) => (
          <div key={k}><dt className="text-xs text-ash">{k}</dt><dd className={`font-mono text-lg ${c}`}>{v}</dd></div>
        ))}
      </dl>
    </section>
  );
}

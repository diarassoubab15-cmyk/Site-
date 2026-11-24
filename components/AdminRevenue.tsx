import { formatPrice } from "@/lib/format";
import { planName } from "@/lib/plans";
import type { AdminRevenue as Revenue } from "@/lib/views";

/** Revenus de NEXORA : forfaits encaissés (paiements confirmés par l'admin), vendeurs payants, renouvellements proches. */
export function AdminRevenue({ revenue }: { revenue: Revenue }) {
  const trend = revenue.lastMonth ? Math.round(((revenue.thisMonth - revenue.lastMonth) / revenue.lastMonth) * 100) : null;
  const month = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return (
    <section className="card space-y-5" aria-labelledby="revenus">
      <h2 id="revenus" className="text-xl font-medium text-white">Revenus · {month}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-[14px] bg-lift p-4">
          <p className="text-xs text-ash">Encaissé ce mois</p>
          <p className="mt-1 font-mono text-xl text-white">{formatPrice(revenue.thisMonth)}</p>
          <p className="mt-1 text-xs text-iron">{revenue.paymentsThisMonth} paiement{revenue.paymentsThisMonth > 1 ? "s" : ""}{trend !== null && <span className={trend >= 0 ? " text-pulse" : " text-alarm"}> · {trend >= 0 ? "+" : ""}{trend} % vs mois dernier</span>}</p>
        </div>
        <div className="rounded-[14px] bg-lift p-4"><p className="text-xs text-ash">Mois dernier</p><p className="mt-1 font-mono text-xl text-white">{formatPrice(revenue.lastMonth)}</p></div>
        <div className="rounded-[14px] bg-lift p-4"><p className="text-xs text-ash">Vendeurs payants</p><p className="mt-1 font-mono text-xl text-white">{revenue.paying}</p></div>
        <div className="rounded-[14px] bg-lift p-4"><p className="text-xs text-ash">Formule gratuite</p><p className="mt-1 font-mono text-xl text-white">{revenue.free}</p><p className="mt-1 text-xs text-iron">à convertir en payants</p></div>
      </div>
      {Object.keys(revenue.byPlan).length > 0 && (
        <p className="text-sm text-ash">Par forfait ce mois : {Object.entries(revenue.byPlan).map(([p, n]) => `${planName(p)} ${formatPrice(n)}`).join(" · ")}</p>
      )}
      <div>
        <h3 className="text-sm font-medium text-white">À renouveler dans les 7 jours</h3>
        {revenue.renewals.length ? (
          <ul className="mt-2 divide-y divide-line text-sm">
            {revenue.renewals.map((r) => (
              <li key={`${r.shop}-${r.until}`} className="flex justify-between gap-3 py-2"><span className="text-bone">{r.shop} · {planName(r.plan)}</span><span className="font-mono text-amber">{new Date(r.until).toLocaleDateString("fr-FR")}</span></li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-iron">Aucun renouvellement dans les 7 jours.</p>}
      </div>
    </section>
  );
}

"use client";
import { CountUp } from "./CountUp";
import { formatPrice } from "@/lib/format";
import { shortDate, type RewardView } from "@/lib/rewards";
import { useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { LiveSeller } from "@/lib/views";

/**
 * Mini tableau de bord de la boutique : réservé au vendeur, piloté par lui seul.
 * (L'administrateur ne peut ni l'ouvrir ni y agir : chaque compte ne voit que sa propre boutique.)
 */
export function SellerStats({ shop, live }: { shop: { id: string; shopName: string; status: string }; live?: LiveSeller | null }) {
  const demo = useDemo();
  const demoOrders = demo.orders.filter((o) => o.shop === shop.shopName);
  const stats = supabaseEnabled
    ? live?.stats ?? null
    : {
        delivered: demoOrders.filter((o) => o.status === "livrée").length,
        revenue: demoOrders.filter((o) => o.status === "livrée").reduce((n, o) => n + o.total, 0),
        openOrders: demoOrders.filter((o) => ["confirmée", "expédiée", "non reçue"].includes(o.status)).length,
        rating: null,
        reviews: 0,
        rank: null,
        competitors: 0,
      };
  const rewards: RewardView[] = supabaseEnabled ? live?.rewards ?? [] : demo.rewards.filter((r) => r.shopId === shop.id && !r.revoked);
  const month = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const tiles: [string, React.ReactNode][] = [
    ["Ventes livrées", <CountUp key="d" value={stats?.delivered ?? 0} />],
    ["Chiffre d'affaires", formatPrice(stats?.revenue ?? 0)],
    ["Commandes à traiter", <CountUp key="o" value={stats?.openOrders ?? 0} />],
    ["Note moyenne", stats?.rating ? `${stats.rating}/5` : "—"],
  ];

  return (
    <section className="card space-y-6" aria-labelledby="tdb">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tdb" className="text-xl font-medium text-white">Tableau de bord · {month}</h2>
        <p className="font-mono text-xs text-iron">géré par vous seul</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-reveal suppressHydrationWarning>
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-[6px] border border-line p-4">
            <p className="text-xs text-ash">{label}</p>
            <p className="mt-2 font-mono text-xl text-white">{value}</p>
          </div>
        ))}
      </div>
      {stats?.rank && stats.competitors > 1 && stats.revenue > 0 ? (
        <p className="text-sm text-bone">
          Vous êtes <span className="font-mono text-iris">{stats.rank}{stats.rank === 1 ? "re" : "e"}</span> sur {stats.competitors} boutiques ce mois-ci (ventes livrées).
          {stats.rank === 1 ? " Continuez : le meilleur vendeur du mois peut gagner un mois gratuit." : " Le meilleur vendeur du mois, du semestre et de l'année peut gagner des mois gratuits."}
        </p>
      ) : (
        <p className="text-sm text-ash">
          {stats && stats.revenue === 0 ? "Pas encore de vente livrée ce mois-ci. " : ""}Le meilleur vendeur du mois, du semestre et de l&apos;année peut gagner des mois d&apos;abonnement gratuits.
        </p>
      )}

      {rewards.length > 0 && (
        <div>
          <h3 className="mb-3 font-medium text-white">Vos récompenses</h3>
          <ul className="space-y-2" data-reveal suppressHydrationWarning>
            {rewards.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-amber/30 px-4 py-3 text-sm">
                <span className="text-white"><span aria-hidden="true">{r.kind === "gift" ? "🎁 " : "🏆 "}</span>{r.title}</span>
                <span className="font-mono text-xs text-amber">
                  {r.freeMonths ? `${r.freeMonths} mois offert${r.freeMonths > 1 ? "s" : ""} · ${shortDate(r.startsOn!)} → ${shortDate(r.endsOn!)}` : "titre honorifique"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

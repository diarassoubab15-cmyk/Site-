"use client";
import { update, useDemo, type NotificationPrefs as Prefs } from "@/lib/demo-store";

const groups: Record<"client" | "vendeur", { key: keyof Prefs; label: string; hint: string }[]> = {
  client: [
    { key: "orderUpdates", label: "Confirmation de commande", hint: "1 e-mail par commande" },
    { key: "deliveryUpdates", label: "Expédition et livraison", hint: "2 e-mails maximum par commande" },
    { key: "reviewRequest", label: "Demande d'avis", hint: "1 seul rappel, jamais relancé" },
    { key: "promotions", label: "Promotions des boutiques suivies", hint: "1 e-mail par semaine au plus" },
    { key: "newsletter", label: "Nouveautés NEXORA", hint: "1 e-mail par mois" },
  ],
  vendeur: [
    { key: "sellerNewOrder", label: "Nouvelle commande", hint: "Indispensable pour expédier à temps" },
    { key: "sellerWeeklySummary", label: "Résumé hebdomadaire des ventes", hint: "Le lundi matin" },
  ],
};

/** Notifications e-mail : peu nombreuses, chacune désactivable. Les e-mails de sécurité (code de connexion) restent toujours actifs. */
export function NotificationPrefs({ role }: { role: "client" | "vendeur" }) {
  const { prefs } = useDemo();
  const allOff = groups[role].every((g) => !prefs[g.key]);
  return (
    <div className="space-y-1">
      {groups[role].map((g) => (
        <label key={g.key} className="flex cursor-pointer items-center justify-between gap-6 rounded-[6px] px-1 py-3">
          <span>
            <span className="block text-sm text-white">{g.label}</span>
            <span className="block text-xs text-iron">{g.hint}</span>
          </span>
          <span className="relative inline-flex">
            <input type="checkbox" role="switch" className="peer sr-only" checked={prefs[g.key]} onChange={(e) => update((s) => ({ ...s, prefs: { ...s.prefs, [g.key]: e.target.checked } }))} />
            <span className="h-6 w-10 rounded-full border border-line bg-black transition-colors peer-checked:border-iris peer-checked:bg-iris/30 peer-focus-visible:outline-2 peer-focus-visible:outline-iris-glow" />
            <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-iron transition-transform peer-checked:translate-x-4 peer-checked:bg-white" />
          </span>
        </label>
      ))}
      <button type="button" className="mt-2 text-xs text-ash hover:text-white" onClick={() => update((s) => ({ ...s, prefs: { ...s.prefs, ...Object.fromEntries(groups[role].map((g) => [g.key, allOff])) } }))}>
        {allOff ? "Tout réactiver" : "Tout désactiver"}
      </button>
      <p className="pt-2 text-xs text-iron">Les codes de connexion et alertes de sécurité restent toujours envoyés.</p>
    </div>
  );
}

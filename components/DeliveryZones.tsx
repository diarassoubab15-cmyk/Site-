"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDeliveryZone, deleteDeliveryZone, setShopPolicies } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import { RETURN_LABELS, type ReturnPolicy } from "@/lib/returns";

type Zone = { id: string; name: string; fee: number; delay: string | null; days_min?: number | null; days_max?: number | null };


/** Suggestions en un toucher, adaptées au Mali (le vendeur ajuste ensuite les prix). */
const PRESETS: { name: string; fee: number; delay: string; daysMin: number; daysMax: number }[] = [
  { name: "Retrait à la boutique", fee: 0, delay: "le jour même", daysMin: 0, daysMax: 0 },
  { name: "Bamako (communes I à VI)", fee: 1000, delay: "24 h", daysMin: 1, daysMax: 1 },
  { name: "Kati, Kalaban Coro, Baguineda", fee: 2000, delay: "24 à 48 h", daysMin: 1, daysMax: 2 },
  { name: "Autres villes du Mali", fee: 3500, delay: "2 à 4 jours", daysMin: 2, daysMax: 4 },
];

/**
 * Zones et frais de livraison de la boutique : le client choisit sa zone en commandant,
 * et les frais s'ajoutent au total (calculé par la base).
 */
export function DeliveryZones({ zones, shipDays = 2, returnPolicy = null }: { zones: Zone[]; shipDays?: number; returnPolicy?: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: "", fee: "", delay: "", daysMin: "", daysMax: "" });
  const [pol, setPol] = useState<{ shipDays: number; returnPolicy: ReturnPolicy | null }>({ shipDays, returnPolicy: (returnPolicy as ReturnPolicy) ?? null });
  const savePolicies = (next: typeof pol) => {
    setPol(next);
    start(async () => { const r = await setShopPolicies(next); if (!r.ok) return toast(r.error ?? "Erreur", "error"); toast("Enregistré", "ok"); router.refresh(); });
  };

  const add = (z: { name: string; fee: number; delay: string; daysMin: number | null; daysMax: number | null }) =>
    start(async () => {
      const r = await addDeliveryZone(z);
      if (!r.ok) return toast(r.error ?? "Erreur", "error");
      toast("Zone ajoutée", "ok");
      setF({ name: "", fee: "", delay: "", daysMin: "", daysMax: "" });
      router.refresh();
    });
  const remove = (id: string) =>
    start(async () => { const r = await deleteDeliveryZone({ id }); if (!r.ok) return toast(r.error ?? "Erreur", "error"); toast("Zone retirée", "ok"); router.refresh(); });

  const unused = PRESETS.filter((p) => !zones.some((z) => z.name === p.name));

  return (
    <section className="card space-y-5" aria-labelledby="livraison">
      <div>
        <h2 id="livraison" className="text-xl font-medium text-white">Zones et frais de livraison</h2>
        <p className="mt-1 text-sm text-ash">Le client choisit sa zone en commandant ; les frais s&apos;ajoutent au total. Sans zone, la livraison est à convenir avec le client.</p>
      </div>

      <div className="grid gap-4 rounded-[18px] bg-lift p-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="ship-days">J&apos;expédie les commandes sous</label>
          <select id="ship-days" className="input" value={pol.shipDays} disabled={pending} onChange={(e) => savePolicies({ ...pol, shipDays: Number(e.target.value) })}>
            {[0, 1, 2, 3, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n === 0 ? "le jour même" : `${n} jour${n > 1 ? "s" : ""}`}</option>)}
          </select>
          <p className="mt-1 text-xs text-iron">Sert à calculer la date de livraison montrée au client. Une commande non livrée à temps apparaît « en retard ».</p>
        </div>
        <div>
          <label className="label" htmlFor="ret">Retours</label>
          <select id="ret" className="input" value={pol.returnPolicy ?? ""} disabled={pending} onChange={(e) => savePolicies({ ...pol, returnPolicy: (e.target.value || null) as ReturnPolicy | null })}>
            <option value="">À convenir avec moi</option>
            {(Object.keys(RETURN_LABELS) as ReturnPolicy[]).map((k) => <option key={k} value={k}>{RETURN_LABELS[k]}</option>)}
          </select>
          <p className="mt-1 text-xs text-iron">Affiché sur chacun de vos produits : une règle claire rassure les acheteurs.</p>
        </div>
      </div>

      {zones.length > 0 && (
        <ul className="divide-y divide-line">
          {zones.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span><span className="text-white">{z.name}</span>{(z.delay || z.days_max != null) && <span className="block text-xs text-ash">délai : {z.days_max != null ? `${z.days_min ?? 0} à ${z.days_max} jour(s)` : z.delay}</span>}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-white">{z.fee ? formatPrice(z.fee) : "Gratuit"}</span>
                <button type="button" className="text-xs text-ash underline underline-offset-4" disabled={pending} onClick={() => remove(z.id)}>Retirer</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {unused.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-ash">Ajout rapide :</p>
          <div className="flex flex-wrap gap-2">
            {unused.map((p) => (
              <button key={p.name} type="button" className="pill text-sm" disabled={pending} onClick={() => add(p)}>
                + {p.name} · <span className="font-mono">{p.fee ? formatPrice(p.fee) : "gratuit"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="grid gap-3 sm:grid-cols-[1fr_120px_90px_90px_auto] sm:items-end" onSubmit={(e) => {
        e.preventDefault();
        const lo = f.daysMin === "" ? null : Number(f.daysMin), hi = f.daysMax === "" ? null : Number(f.daysMax);
        add({ name: f.name, fee: Number(f.fee.replace(/\D/g, "")) || 0, delay: lo !== null && hi !== null ? `${lo} à ${hi} jour(s)` : "", daysMin: lo, daysMax: hi });
      }}>
        <div><label className="label" htmlFor="z-name">Zone</label><input id="z-name" required minLength={2} maxLength={60} className="input" placeholder="Ex. : Sébénikoro, Ségou…" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="z-fee">Frais (FCFA)</label><input id="z-fee" inputMode="numeric" className="input font-mono" placeholder="0" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value.replace(/[^\d ]/g, "") })} /></div>
        <div><label className="label" htmlFor="z-min">Jours min.</label><input id="z-min" inputMode="numeric" className="input font-mono" placeholder="1" value={f.daysMin} onChange={(e) => setF({ ...f, daysMin: e.target.value.replace(/\D/g, "").slice(0, 2) })} /></div>
        <div><label className="label" htmlFor="z-max">Jours max.</label><input id="z-max" inputMode="numeric" className="input font-mono" placeholder="3" value={f.daysMax} onChange={(e) => setF({ ...f, daysMax: e.target.value.replace(/\D/g, "").slice(0, 2) })} /></div>
        <button className="btn-solid" disabled={pending}>Ajouter</button>
      </form>
    </section>
  );
}

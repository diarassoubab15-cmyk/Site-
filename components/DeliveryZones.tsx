"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDeliveryZone, deleteDeliveryZone } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";

type Zone = { id: string; name: string; fee: number; delay: string | null };

/** Suggestions en un toucher, adaptées au Mali (le vendeur ajuste ensuite les prix). */
const PRESETS: { name: string; fee: number; delay: string }[] = [
  { name: "Retrait à la boutique", fee: 0, delay: "le jour même" },
  { name: "Bamako (communes I à VI)", fee: 1000, delay: "24 h" },
  { name: "Kati, Kalaban Coro, Baguineda", fee: 2000, delay: "24 à 48 h" },
  { name: "Autres villes du Mali", fee: 3500, delay: "2 à 4 jours" },
];

/**
 * Zones et frais de livraison de la boutique : le client choisit sa zone en commandant,
 * et les frais s'ajoutent au total (calculé par la base).
 */
export function DeliveryZones({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: "", fee: "", delay: "" });

  const add = (z: { name: string; fee: number; delay: string }) =>
    start(async () => {
      const r = await addDeliveryZone(z);
      if (!r.ok) return toast(r.error ?? "Erreur", "error");
      toast("Zone ajoutée", "ok");
      setF({ name: "", fee: "", delay: "" });
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

      {zones.length > 0 && (
        <ul className="divide-y divide-line">
          {zones.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span><span className="text-white">{z.name}</span>{z.delay && <span className="block text-xs text-ash">délai : {z.delay}</span>}</span>
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

      <form className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); add({ name: f.name, fee: Number(f.fee.replace(/\D/g, "")) || 0, delay: f.delay }); }}>
        <div><label className="label" htmlFor="z-name">Zone</label><input id="z-name" required minLength={2} maxLength={60} className="input" placeholder="Ex. : Sébénikoro, Ségou…" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="z-fee">Frais (FCFA)</label><input id="z-fee" inputMode="numeric" className="input font-mono" placeholder="0" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value.replace(/[^\d ]/g, "") })} /></div>
        <div><label className="label" htmlFor="z-delay">Délai</label><input id="z-delay" maxLength={40} className="input" placeholder="24 h" value={f.delay} onChange={(e) => setF({ ...f, delay: e.target.value })} /></div>
        <button className="btn-solid" disabled={pending}>Ajouter</button>
      </form>
    </section>
  );
}

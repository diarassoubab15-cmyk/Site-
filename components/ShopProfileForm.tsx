"use client";
import { PhoneInput } from "./PhoneInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { isMapsUrl } from "@/lib/maps";
import type { ShopProfile } from "@/lib/server-data";
import { updateShopProfile } from "@/app/actions";

/** Le vendeur tient à jour la fiche publique de sa boutique : adresse, carte, WhatsApp, appel, quelques prix. */
export function ShopProfileForm({ profile, slug }: { profile: ShopProfile; slug?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({
    city: profile.city, district: profile.district, isPhysical: profile.isPhysical, mapsUrl: profile.mapsUrl,
    whatsapp: profile.whatsapp, callPhone: profile.callPhone,
    samples: profile.samples.length ? profile.samples.map((s) => ({ name: s.name, price: String(s.price) })) : [{ name: "", price: "" }],
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.isPhysical && f.mapsUrl && !isMapsUrl(f.mapsUrl)) return toast("Ce lien n'est pas un lien Google Maps.", "error");
    start(async () => {
      const r = await updateShopProfile({
        ...f,
        samples: f.samples.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), price: Number(s.price.replace(/\D/g, "")) })),
      });
      toast(r.ok ? "Fiche de la boutique mise à jour" : r.error ?? "Erreur", r.ok ? "ok" : "error");
      if (r.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="card space-y-5" aria-labelledby="fiche-titre">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="fiche-titre" className="text-lg font-medium text-white">Fiche de la boutique</h2>
        {slug && <Link href={`/boutiques/${slug}`} prefetch={false} className="text-sm text-ash hover:text-white">Voir ma boutique</Link>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="pf-city">Ville</label><input id="pf-city" required className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        <div><label className="label" htmlFor="pf-district">Quartier</label><input id="pf-district" maxLength={80} className="input" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} /></div>
        <PhoneInput id="pf-wa" label="WhatsApp" required value={f.whatsapp} onChange={(v) => setF({ ...f, whatsapp: v })} />
        <PhoneInput id="pf-call" label="Appels" required value={f.callPhone} onChange={(v) => setF({ ...f, callPhone: v })} />
        <label className="flex items-center gap-3 text-sm text-bone sm:col-span-2">
          <input type="checkbox" checked={f.isPhysical} onChange={(e) => setF({ ...f, isPhysical: e.target.checked })} className="accent-[#5433eb]" />
          Boutique physique (les clients peuvent venir)
        </label>
        {f.isPhysical && (
          <div className="sm:col-span-2"><label className="label" htmlFor="pf-maps">Lien Google Maps</label><input id="pf-maps" inputMode="url" className="input font-mono text-xs" placeholder="https://maps.app.goo.gl/…" value={f.mapsUrl} onChange={(e) => setF({ ...f, mapsUrl: e.target.value })} /></div>
        )}
      </div>
      <fieldset className="space-y-2">
        <legend className="label">Quelques prix affichés sur la boutique</legend>
        {f.samples.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input aria-label={`Produit ${i + 1}`} className="input flex-1" maxLength={60} value={s.name} onChange={(e) => setF({ ...f, samples: f.samples.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
            <input aria-label={`Prix ${i + 1} en FCFA`} className="input w-32 font-mono" inputMode="numeric" value={s.price} onChange={(e) => setF({ ...f, samples: f.samples.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/[^\d ]/g, "") } : x)) })} />
            <button type="button" className="btn px-3" aria-label={`Retirer le produit ${i + 1}`} onClick={() => setF({ ...f, samples: f.samples.filter((_, j) => j !== i) })}>×</button>
          </div>
        ))}
        {f.samples.length < 5 && <button type="button" className="text-sm text-ash hover:text-white" onClick={() => setF({ ...f, samples: [...f.samples, { name: "", price: "" }] })}>+ Ajouter un prix</button>}
      </fieldset>
      <button className="btn-solid" disabled={pending} data-haptic>{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}

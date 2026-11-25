"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setShopPixels } from "@/app/actions";
import { toast } from "@/lib/toast";

/** Espace vendeur : identifiants des pixels Facebook et TikTok (forfaits Pro et Ultra). */
export function ShopPixelsForm({ fb, tiktok, allowed }: { fb: string; tiktok: string; allowed: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ fb, tiktok });
  return (
    <section className="card space-y-4" aria-labelledby="pixels">
      <div>
        <h2 id="pixels" className="text-xl font-medium text-white">Suivi de vos publicités</h2>
        <p className="mt-1 text-sm text-ash">Vous faites de la publicité sur Facebook, Instagram ou TikTok ? Ajoutez votre pixel : vous verrez combien de visites et de commandes vos pubs apportent à votre boutique NEXORA.</p>
      </div>
      {!allowed ? (
        <p className="rounded-[14px] bg-lift p-3 text-sm text-ash">Inclus dans les forfaits <strong className="text-white">Pro</strong> et <strong className="text-white">Ultra</strong>.</p>
      ) : (
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => {
          e.preventDefault();
          start(async () => { const r = await setShopPixels(f); if (!r.ok) return toast(r.error ?? "Erreur", "error"); toast("Pixels enregistrés", "ok"); router.refresh(); });
        }}>
          <div><label className="label" htmlFor="px-fb">Pixel Facebook (ID)</label><input id="px-fb" inputMode="numeric" className="input font-mono" placeholder="123456789012345" value={f.fb} onChange={(e) => setF({ ...f, fb: e.target.value.replace(/\D/g, "") })} /></div>
          <div><label className="label" htmlFor="px-tt">Pixel TikTok (ID)</label><input id="px-tt" className="input font-mono uppercase" placeholder="C1AB2CD3EF4GH5" value={f.tiktok} onChange={(e) => setF({ ...f, tiktok: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} /></div>
          <button className="btn-solid" disabled={pending}>{pending ? "…" : "Enregistrer"}</button>
        </form>
      )}
    </section>
  );
}

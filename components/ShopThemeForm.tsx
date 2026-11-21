"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { BRAND_COLORS, FONTS, SIGNATURES, tierLabel, type DisplayFont, type Signature, type Tier } from "@/lib/shop-theme";
import { updateShopTheme } from "@/app/actions";
import { ShopHero } from "./ShopHero";

/**
 * Apparence de la boutique, avec aperçu en direct :
 * couleur de marque (Pro et Ultra) ; animation signature et police (Ultra, « Vitrine Ultra »).
 * Les réglages sont enregistrés quel que soit le forfait, et s'affichent dès que le forfait les inclut.
 */
export function ShopThemeForm({ shopName, typeName, place, tier, initial, fallbackColor }: {
  shopName: string; typeName?: string; place: string; tier: Tier | null;
  initial: { brandColor: string | null; signature: string | null; displayFont: string | null }; fallbackColor: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [color, setColor] = useState(initial.brandColor);
  const [sig, setSig] = useState<Signature | null>((initial.signature as Signature) ?? null);
  const [font, setFont] = useState<DisplayFont | null>((initial.displayFont as DisplayFont) ?? null);
  const [replay, setReplay] = useState(0);
  const pro = tier === "pro" || tier === "business";
  const ultra = tier === "business";
  const shown = color ?? fallbackColor;

  function save() {
    start(async () => {
      const r = await updateShopTheme({ brandColor: color as never, signature: sig, displayFont: font });
      toast(r.ok ? "Apparence enregistrée" : r.error ?? "Erreur", r.ok ? "ok" : "error");
      if (r.ok) router.refresh();
    });
  }

  return (
    <section className="card space-y-6" aria-labelledby="apparence-titre">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="apparence-titre" className="text-lg font-medium text-white">Apparence de la boutique</h2>
        <span className="font-mono text-xs text-iron">forfait {tierLabel(tier)}</span>
      </div>
      {!pro && (
        <p className="rounded-[10px] border border-line p-3 text-sm text-ash">
          La boutique animée aux couleurs de votre marque est incluse dans le forfait <strong className="text-white">Pro</strong>, la Vitrine Ultra dans <strong className="text-white">Ultra</strong>.
          Vous pouvez déjà préparer votre apparence : elle s&apos;affichera dès le changement de forfait. <Link href="/tarifs" className="link">Voir les forfaits</Link>
        </p>
      )}

      <fieldset>
        <legend className="label">Couleur de la marque <span className="text-iron">(Pro et Ultra)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BRAND_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              aria-pressed={color === c.hex}
              aria-label={c.name}
              title={c.name}
              onClick={() => { setColor(c.hex); setReplay((n) => n + 1); }}
              className={`h-10 w-10 rounded-full border-2 transition-transform active:scale-95 ${color === c.hex ? "border-white" : "border-transparent"}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Animation signature <span className="text-iron">(Ultra)</span></legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SIGNATURES.map((s) => (
            <label key={s.id} className={`flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-2.5 text-sm ${sig === s.id ? "border-white text-white" : "border-line text-bone"}`}>
              <input type="radio" name="signature" checked={sig === s.id} onChange={() => { setSig(s.id); setReplay((n) => n + 1); }} className="mt-0.5" style={{ accentColor: shown }} />
              <span><span className="block">{s.name}</span><span className="block text-xs text-ash">{s.text}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Police du nom <span className="text-iron">(Ultra)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FONTS.map((f) => (
            <label key={f.id} className={`cursor-pointer rounded-[10px] border px-4 py-2 ${font === f.id ? "border-white text-white" : "border-line text-bone"}`} style={{ fontFamily: f.css, fontWeight: f.weight }}>
              <input type="radio" name="font" className="sr-only" checked={font === f.id} onChange={() => { setFont(f.id); setReplay((n) => n + 1); }} />
              {f.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-ash">Aperçu {ultra || !pro ? "Vitrine Ultra" : "boutique animée"}</span>
          <button type="button" className="text-ash hover:text-white" onClick={() => setReplay((n) => n + 1)}>Rejouer</button>
        </div>
        <div className="pointer-events-none" data-theme-preview>
          <ShopHero
            key={replay}
            name={shopName} place={place} typeName={typeName} color={shown} tier={ultra || !pro ? "business" : "pro"}
            signature={sig ?? undefined} font={font ?? undefined} verified
          />
        </div>
      </div>

      <button type="button" className="btn-solid" data-haptic disabled={pending} onClick={save}>{pending ? "Enregistrement…" : "Enregistrer l'apparence"}</button>
    </section>
  );
}

"use client";
import Link from "next/link";
import { useDialog } from "@/lib/use-dialog";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { addToCart } from "@/lib/cart";
import { compressImage } from "@/lib/image-compress";
import { formatPrice } from "@/lib/format";
import type { PaymentMethodId } from "@/lib/payments";
import { toast } from "@/lib/toast";
import { tryOn, tryOnStatus } from "@/app/actions";

export type TryOnItem = { slug: string; name: string; image: string; price: number; payments: PaymentMethodId[] };
type Status = Awaited<ReturnType<typeof tryOnStatus>>;
type Phase = "choose" | "working" | "result";

const toDataUrl = (blob: Blob) =>
  new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); });

/**
 * Essayage virtuel : le client choisit un ensemble (vêtements encadrés dans la couleur de la boutique),
 * touche « Tester », choisit une photo dans sa galerie, et le rendu est généré automatiquement.
 * La photo est compressée sur le téléphone et n'est jamais conservée par NEXORA.
 */
export function TryOn({ shopSlug, shopName, color, items, initial }: { shopSlug: string; shopName: string; color: string; items: TryOnItem[]; initial: string }) {
  const [open, setOpen] = useState(false);
  const dlg = useDialog<HTMLDivElement>(open);
  const [picked, setPicked] = useState<string[]>([initial]);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [phase, setPhase] = useState<Phase>("choose");
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    let alive = true;
    tryOnStatus(shopSlug).then((s) => alive && setStatus(s)).catch(() => alive && setStatus({ loggedIn: false, ready: false, remaining: null }));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && phase !== "working" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { alive = false; document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, shopSlug, phase]);

  const toggle = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : p.length >= 3 ? (toast("3 vêtements au plus par essai", "info"), p) : [...p, slug]));

  async function onPhoto(file?: File) {
    if (!file) return;
    setError("");
    try {
      const c = await compressImage(file, 1024, 0.85);
      const dataUrl = await toDataUrl(c.blob);
      setPhoto(dataUrl);
      setResult(null);
      setPhase("working");
      // Génération automatique dès que la photo est choisie
      const r = await tryOn({ shopSlug, slugs: picked, photo: dataUrl });
      if (!r.ok) { setError(r.error); setPhase("choose"); return; }
      setResult(r.data!.image);
      setStatus((s) => (s ? { ...s, remaining: r.data!.remaining } : s));
      setPhase("result");
    } catch {
      setError("Photo illisible. Essayez une autre photo (JPEG ou PNG).");
      setPhase("choose");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  const left = status?.remaining;
  const blocked = !status?.loggedIn || !status.ready || (left !== null && left !== undefined && left <= 0);
  const chosen = items.filter((i) => picked.includes(i.slug));

  return (
    <>
      <button type="button" className="tryon-cta w-full" style={{ ["--c" as string]: color }} data-haptic onClick={() => { setOpen(true); setPhase("choose"); setError(""); }}>
        <span aria-hidden="true">✦</span> Essayer sur ma photo
      </button>
      {open && createPortal(
        <div ref={dlg} role="dialog" aria-modal="true" aria-label="Essayage virtuel" className="fixed inset-0 z-[95] flex flex-col bg-black" style={{ ["--c" as string]: color }}>
          <div className="flex items-center justify-between gap-3 border-b border-line p-3 text-sm">
            <span className="truncate text-white">Essayage virtuel · <span style={{ color }}>{shopName}</span></span>
            <button type="button" className="btn shrink-0 px-3 py-1.5" disabled={phase === "working"} onClick={() => setOpen(false)}>Fermer</button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="container-x max-w-3xl space-y-6 py-6">
              {phase === "choose" && (
                <>
                  <div>
                    <h2 className="font-display text-3xl text-white">Choisissez votre ensemble</h2>
                    <p className="mt-1 text-sm text-ash">1 à 3 vêtements de cette boutique. Touchez pour ajouter ou retirer.</p>
                  </div>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-tryon-items>
                    {items.map((it) => {
                      const on = picked.includes(it.slug);
                      return (
                        <li key={it.slug}>
                          <button type="button" aria-pressed={on} onClick={() => toggle(it.slug)} className={`tryon-item w-full text-left ${on ? "is-on" : ""}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.image} alt="" className="aspect-square w-full rounded-[10px] object-cover" />
                            <span className="mt-2 block truncate text-sm text-white">{it.name}</span>
                            <span className="block font-mono text-xs text-ash">{formatPrice(it.price)}</span>
                            {on && <span className="tryon-check" aria-hidden="true">✓</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <label className="flex items-start gap-3 rounded-[10px] border border-line p-3 text-sm text-bone">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" style={{ accentColor: color }} />
                    <span>J&apos;utilise une photo de moi. Elle sert uniquement à cet essai, transmise au service d&apos;essayage : NEXORA ne la conserve pas.</span>
                  </label>
                  {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
                  {status && !status.loggedIn && (
                    <p className="text-sm text-ash"><Link href={`/connexion?next=${encodeURIComponent(location.pathname)}`} className="link">Connectez-vous</Link> pour essayer : vos essais sont offerts par la boutique.</p>
                  )}
                  {status?.loggedIn && !status.ready && <p className="text-sm text-amber">L&apos;essayage par IA arrive très bientôt sur NEXORA. Aucun essai ne vous sera décompté d&apos;ici là.</p>}
                  {status?.loggedIn && status.ready && (
                    <p className="text-sm text-ash" data-tryon-left>{left == null ? "Essais illimités dans cette boutique." : left > 0 ? `Il vous reste ${left} essai${left > 1 ? "s" : ""} dans cette boutique.` : "Vous avez utilisé tous vos essais dans cette boutique."}</p>
                  )}
                </>
              )}

              {phase !== "choose" && photo && (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-md overflow-hidden rounded-[18px] border border-line" style={{ borderColor: color }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={phase === "result" && result && !showBefore ? result : photo} alt={phase === "result" && !showBefore ? "Rendu de l'essayage" : "Votre photo"} className="w-full" data-tryon-result={phase === "result" ? "" : undefined} />
                    {phase === "working" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45" role="status">
                        <span className="tryon-scan" aria-hidden="true" />
                        <p className="relative rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-[25px]">Essayage en cours…</p>
                      </div>
                    )}
                  </div>
                  {phase === "result" && (
                    <>
                      <p className="sr-only" role="status">Rendu de l&apos;essayage prêt.</p>
                      <p className="text-center text-xs text-iron">Rendu généré par IA, pour vous faire une idée : les couleurs et la coupe réelles peuvent varier légèrement.</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button type="button" className="btn" onPointerDown={() => setShowBefore(true)} onPointerUp={() => setShowBefore(false)} onPointerLeave={() => setShowBefore(false)} onKeyDown={(e) => e.key === " " && setShowBefore(true)} onKeyUp={() => setShowBefore(false)}>
                          Maintenir pour voir l&apos;avant
                        </button>
                        <button type="button" className="btn-solid" data-haptic onClick={() => { chosen.forEach((i) => addToCart({ slug: i.slug, name: i.name, price: i.price, shopName, payments: i.payments, image: i.image })); toast(`Ensemble ajouté au panier (${chosen.length})`); }}>
                          Ajouter l&apos;ensemble au panier
                        </button>
                        <button type="button" className="btn" onClick={() => { setPhase("choose"); setResult(null); }}>Nouvel essai</button>
                      </div>
                      <p className="text-center text-sm text-ash" data-tryon-left>{left === null ? "Essais illimités." : `Il vous reste ${left} essai${(left ?? 0) > 1 ? "s" : ""}.`}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {phase === "choose" && (
            <div className="border-t border-line p-3">
              <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choisir une photo de moi" onChange={(e) => onPhoto(e.target.files?.[0])} data-tryon-input />
              <button
                type="button"
                className="tryon-cta w-full"
                disabled={!picked.length || !consent || blocked}
                onClick={() => input.current?.click()}
                data-haptic
              >
                Tester {picked.length > 1 ? `l'ensemble (${picked.length})` : "ce vêtement"}
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

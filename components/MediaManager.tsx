"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { compressImage, isEquirect } from "@/lib/image-compress";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { SellerProductMedia } from "@/lib/server-data";
import { addProductMedia, deleteProductMedia, updateProductMedia } from "@/app/actions";

type Kind = "photo" | "pano" | "spin";
const SETTINGS: Record<Kind, { max: number; side: number; quality: number; title: string; help: string }> = {
  photo: { max: 12, side: 1600, quality: 0.82, title: "Photos", help: "Jusqu'à 12 photos. La première sert de vignette. Compressées sur votre téléphone avant l'envoi." },
  pano: {
    max: 12, side: 4096, quality: 0.85, title: "Visite 360°",
    help: "Une photo 360° par pièce (format 2:1), prise avec une caméra 360° ou une application « photo sphère ». Donnez un nom à chaque pièce.",
  },
  spin: {
    max: 36, side: 1200, quality: 0.8, title: "Rotation 360°",
    help: "Posez le produit au centre, sur un fond uni, et prenez 24 à 36 photos en tournant autour, à la même hauteur et la même distance. Envoyez-les toutes d'un coup : elles sont rangées dans l'ordre de prise de vue (nom des fichiers). La rotation s'affiche sur la fiche à partir de 8 photos.",
  },
};

const rand = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

/** Envoi et gestion des médias d'un produit (le fichier va directement dans le dossier de la boutique). */
export function MediaManager({ shopId, productId, kind, items }: { shopId: string; productId: string; kind: Kind; items: SellerProductMedia[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cfg = SETTINGS[kind];
  const list = items.filter((m) => m.kind === kind).sort((a, b) => a.position - b.position);
  const room = list.length;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    // Rotation : l'ordre compte, on suit l'ordre de prise de vue (les appareils numérotent les fichiers).
    const sorted = kind === "spin" ? [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) : [...files];
    const chosen = sorted.slice(0, cfg.max - room);
    if (files.length > chosen.length) toast(`Limite de ${cfg.max} fichiers : ${chosen.length} envoyé(s).`, "info");
    const sb = supabaseBrowser();
    let done = 0;
    for (const file of chosen) {
      try {
        setBusy(`Compression ${done + 1}/${chosen.length}…`);
        const c = await compressImage(file, cfg.side, cfg.quality);
        if (kind === "pano" && !isEquirect(c.width, c.height)) {
          toast(`« ${file.name} » n'est pas une photo 360° (format 2:1 attendu).`, "error");
          continue;
        }
        setBusy(`Envoi ${done + 1}/${chosen.length} (${Math.round(c.blob.size / 1024)} Ko)…`);
        const path = `${shopId}/${productId}/${kind}-${rand()}.${c.ext}`;
        const { error } = await sb.storage.from("product-media").upload(path, c.blob, { contentType: c.blob.type, cacheControl: "31536000", upsert: false });
        if (error) throw new Error(error.message);
        const label = kind === "pano" ? file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 40) : undefined;
        const r = await addProductMedia({ productId, kind, path, width: c.width, height: c.height, label });
        if (!r.ok) throw new Error(r.error);
        done++;
      } catch (e) {
        toast((e as Error).message || "Envoi impossible", "error");
      }
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    if (done) toast(`${done} fichier(s) ajouté(s)`);
    router.refresh();
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const order = [...list];
    [order[i], order[j]] = [order[j], order[i]];
    start(async () => {
      const r = await updateProductMedia({ items: order.map((m, k) => ({ id: m.id, position: k })) });
      if (!r.ok) toast(r.error, "error");
      router.refresh();
    });
  }

  return (
    <section className="card space-y-4" aria-labelledby={`media-${kind}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`media-${kind}`} className="text-lg font-medium text-white">{cfg.title}</h2>
        <span className="flex items-baseline gap-3">
          {kind === "spin" && list.length > 0 && (
            <button
              type="button"
              className="text-xs text-alarm hover:underline"
              disabled={pending || !!busy}
              onClick={() => {
                if (!confirm(`Supprimer les ${list.length} photos de rotation ?`)) return;
                start(async () => {
                  let failed = 0;
                  for (const m of list) if (!(await deleteProductMedia({ id: m.id })).ok) failed++;
                  toast(failed ? `${failed} photo(s) non supprimée(s)` : "Rotation supprimée", failed ? "error" : "ok");
                  router.refresh();
                });
              }}
            >
              Tout supprimer
            </button>
          )}
          <span className="font-mono text-xs text-iron">{room}/{cfg.max}</span>
        </span>
      </div>
      <p className="text-sm text-ash">{cfg.help}</p>
      {list.length > 0 && (
        <ul className={`grid gap-3 ${kind === "pano" ? "sm:grid-cols-2" : kind === "spin" ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4"}`}>
          {list.map((m, i) => (
            <li key={m.id} className="space-y-2 rounded-[6px] border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.label ?? `${cfg.title} ${i + 1}`} loading="lazy" className={`w-full rounded-[4px] object-cover ${kind === "pano" ? "aspect-[2/1]" : "aspect-square"}`} />
              {kind === "pano" && (
                <input
                  aria-label="Nom de la pièce"
                  defaultValue={m.label ?? ""}
                  maxLength={40}
                  placeholder="Nom de la pièce"
                  className="input py-1.5 text-xs"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v === (m.label ?? "")) return;
                    start(async () => {
                      const r = await updateProductMedia({ items: [{ id: m.id, position: m.position, label: v }] });
                      toast(r.ok ? "Pièce renommée" : r.error ?? "Erreur", r.ok ? "ok" : "error");
                    });
                  }}
                />
              )}
              <div className="flex items-center justify-between gap-1 text-xs">
                <span className="flex gap-1">
                  <button type="button" className="btn px-2 py-1 text-xs" disabled={pending || i === 0} onClick={() => move(i, -1)} aria-label="Avancer">←</button>
                  <button type="button" className="btn px-2 py-1 text-xs" disabled={pending || i === list.length - 1} onClick={() => move(i, 1)} aria-label="Reculer">→</button>
                </span>
                <button
                  type="button"
                  className="text-alarm hover:underline"
                  disabled={pending}
                  onClick={() => start(async () => { const r = await deleteProductMedia({ id: m.id }); toast(r.ok ? "Supprimé" : r.error ?? "Erreur", r.ok ? "ok" : "error"); router.refresh(); })}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {room < cfg.max && (
        <div className="flex flex-wrap items-center gap-3">
          <label className={`btn cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={!!busy} />
            + Ajouter {kind === "pano" ? "des panoramas" : kind === "spin" ? "les photos de rotation" : "des photos"}
          </label>
          {busy && <span className="font-mono text-xs text-iris" role="status">{busy}</span>}
        </div>
      )}
    </section>
  );
}

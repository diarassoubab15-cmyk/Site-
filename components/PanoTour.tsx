"use client";
import { useEffect, useRef, useState } from "react";
import { useDialog } from "@/lib/use-dialog";
import { createPortal } from "react-dom";
import type { PanoHandle } from "@/lib/pano-scene";

/** Visite 360° pièce par pièce, en plein écran. La visionneuse n'est téléchargée qu'à l'ouverture. */
export function PanoTour({ panos, title }: { panos: { url: string; label: string }[]; title: string }) {
  const [open, setOpen] = useState(false);
  const dlg = useDialog<HTMLDivElement>(open);
  const [room, setRoom] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "flat" | "error">("loading");
  const [hint, setHint] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const viewer = useRef<PanoHandle | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    document.body.style.overflow = "hidden";
    setState("loading");
    import("@/lib/pano-scene").then(({ mountPano }) => {
      if (cancelled || !box.current) return;
      const v = mountPano(box.current, () => setHint(false));
      if (!v) return setState("flat");
      viewer.current = v;
      v.show(panos[room].url).then(() => !cancelled && setState("ready")).catch(() => setState("error"));
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      viewer.current?.dispose();
      viewer.current = null;
    };
    // la pièce affichée à l'ouverture seulement ; les changements passent par go()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function go(i: number) {
    setRoom(i);
    if (!viewer.current) return;
    setState("loading");
    viewer.current.show(panos[i].url).then(() => setState("ready")).catch(() => setState("error"));
  }

  return (
    <>
      <button type="button" className="btn w-full" data-haptic onClick={() => { setRoom(0); setOpen(true); }}>
        <span aria-hidden="true">◎</span> Visite 360° · {panos.length} pièce{panos.length > 1 ? "s" : ""}
      </button>
      {/* Rendu à la racine du document : aucune colonne collante ni animation ne peut l'enfermer. */}
      {open && createPortal(
        <div ref={dlg} role="dialog" aria-modal="true" aria-label={`Visite 360° : ${title}`} className="fixed inset-0 z-[95] flex flex-col bg-black">
          <div className="flex items-center justify-between gap-3 p-3 text-sm">
            <span className="truncate text-white">{title} · <span className="text-iris-glow">{panos[room].label}</span></span>
            <button type="button" className="btn shrink-0 px-3 py-1.5" onClick={() => setOpen(false)}>Fermer</button>
          </div>
          <div ref={box} className="relative min-h-0 flex-1">
            {state === "flat" && (
              <div className="h-full overflow-x-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={panos[room].url} alt={panos[room].label} className="h-full max-w-none" />
              </div>
            )}
            {state === "loading" && <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-xs text-ash">chargement de la pièce…</div>}
            {state === "error" && <div className="absolute inset-0 flex items-center justify-center text-sm text-alarm">Panorama indisponible.</div>}
            {state === "ready" && hint && (
              <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs text-white backdrop-blur-[25px]">
                Glissez pour regarder autour · pincez pour zoomer
              </p>
            )}
          </div>
          {panos.length > 1 && (
            <nav aria-label="Pièces" className="flex gap-2 overflow-x-auto p-3">
              {panos.map((p, i) => (
                <button key={p.url} type="button" onClick={() => go(i)} aria-current={i === room} className={`pill shrink-0 ${i === room ? "border-white text-white" : "text-ash"}`}>
                  {p.label}
                </button>
              ))}
            </nav>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

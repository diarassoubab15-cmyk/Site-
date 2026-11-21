"use client";
import { useEffect, useRef, useState } from "react";
import { useDialog } from "@/lib/use-dialog";
import { createPortal } from "react-dom";

/**
 * Rotation 360° d'un objet à partir de vraies photos prises en tournant autour.
 * Aucune 3D : on affiche la bonne photo selon le glissement du doigt. Les photos ne sont
 * téléchargées qu'à l'ouverture, la première d'abord, puis les autres en arrière-plan.
 */
export function SpinViewer({ frames, title }: { frames: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const dlg = useDialog<HTMLDivElement>(open);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [hint, setHint] = useState(true);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const auto = useRef<number | null>(null);
  const n = frames.length;
  const ready = loaded >= n;

  const stopAuto = () => {
    if (auto.current) cancelAnimationFrame(auto.current);
    auto.current = null;
  };

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setLoaded(0);
    let cancelled = false;
    // Chargement dans l'ordre : la première vue s'affiche tout de suite.
    (async () => {
      for (const src of frames) {
        if (cancelled) return;
        await new Promise<void>((done) => {
          const img = new Image();
          img.onload = img.onerror = () => done();
          img.src = src;
        });
        if (!cancelled) setLoaded((l) => l + 1);
      }
    })();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") { stopAuto(); setHint(false); setI((v) => (v + 1) % n); }
      if (e.key === "ArrowLeft") { stopAuto(); setHint(false); setI((v) => (v - 1 + n) % n); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      stopAuto();
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, frames, n]);

  // Un tour complet de démonstration une fois tout chargé (sauf mouvement réduit).
  useEffect(() => {
    if (!open || !ready || !hint || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    const turn = 2400;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / turn);
      setI(Math.round(p * n) % n);
      auto.current = p < 1 ? requestAnimationFrame(step) : null;
    };
    auto.current = requestAnimationFrame(step);
    return stopAuto;
  }, [open, ready, hint, n]);

  function onDown(e: React.PointerEvent) {
    stopAuto();
    setHint(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: i };
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    // Un tour complet pour la largeur de l'écran (au moins 6 px par vue).
    const perFrame = Math.max(6, window.innerWidth / n);
    const d = Math.round((drag.current.x - e.clientX) / perFrame);
    setI((((drag.current.start + d) % n) + n) % n);
  }
  const onUp = () => { drag.current = null; };

  return (
    <>
      <button type="button" className="btn w-full" data-haptic onClick={() => { setI(0); setHint(true); setOpen(true); }}>
        <span aria-hidden="true">⟳</span> Rotation 360° · {n} vues
      </button>
      {open && createPortal(
        <div ref={dlg} role="dialog" aria-modal="true" aria-label={`Rotation 360° : ${title}`} className="fixed inset-0 z-[95] flex flex-col bg-black">
          <div className="flex items-center justify-between gap-3 p-3 text-sm">
            <span className="truncate text-white">{title} · <span className="text-iris-glow">rotation 360°</span></span>
            <button type="button" className="btn shrink-0 px-3 py-1.5" onClick={() => setOpen(false)}>Fermer</button>
          </div>
          <div
            className="relative min-h-0 flex-1 cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            data-spin-stage
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- photos déjà compressées à l'envoi */}
            <img src={frames[i]} alt={`${title}, vue ${i + 1} sur ${n}`} draggable={false} className="absolute inset-0 h-full w-full object-contain" data-frame={i} />
            {!ready && (
              <p className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 font-mono text-xs text-ash" role="status">
                chargement {loaded}/{n}
              </p>
            )}
            {ready && hint && (
              <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs text-white backdrop-blur-[25px]">
                Glissez pour faire tourner
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 p-3">
            <span className="font-mono text-xs text-ash">{i + 1}/{n}</span>
            <input
              type="range"
              min={0}
              max={n - 1}
              value={i}
              aria-label="Angle de vue"
              className="flex-1 accent-[#9281f7]"
              onChange={(e) => { stopAuto(); setHint(false); setI(Number(e.target.value)); }}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/data";

/** Galerie de vraies photos : vignettes, plein écran, zoom par tapotement et déplacement au doigt. */
export function ProductGallery({ product }: { product: Product }) {
  const images = product.images ?? [];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") { setZoom(false); setIndex((i) => (i + 1) % images.length); }
      if (e.key === "ArrowLeft") { setZoom(false); setIndex((i) => (i - 1 + images.length) % images.length); }
    };
    window.addEventListener("keydown", onKey);
    dialog.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, images.length]);

  const pointTo = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="space-y-3">
      <button type="button" className="relative block w-full overflow-hidden rounded-[16px] border border-line bg-lift" onClick={() => setOpen(true)} aria-label="Agrandir la photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={`${product.name}, photo ${index + 1}`} className="aspect-square w-full object-cover" />
        <span className="badge absolute bottom-3 right-3 border-white/20 bg-black/60 text-white backdrop-blur-[25px]">{index + 1}/{images.length} · agrandir</span>
      </button>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Photos">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button type="button" onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`} aria-current={i === index} className={`block h-16 w-16 overflow-hidden rounded-[8px] border ${i === index ? "border-white" : "border-line"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Rendu à la racine du document : aucune colonne collante ni animation ne peut l'enfermer. */}
      {open && createPortal(
        <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Photos de ${product.name}`} className="fixed inset-0 z-[95] flex flex-col bg-black/95 outline-none backdrop-blur-[25px]">
          <div className="flex items-center justify-between p-4 text-sm text-bone">
            <span className="font-mono">{index + 1}/{images.length}</span>
            <span className="text-ash">{zoom ? "Glissez pour explorer · touchez pour dézoomer" : "Touchez la photo pour zoomer"}</span>
            <button type="button" className="btn px-3 py-1.5" onClick={() => setOpen(false)}>Fermer</button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index]}
              alt={`${product.name}, photo ${index + 1}`}
              className="max-h-full max-w-full touch-none select-none object-contain transition-transform duration-200 ease-out"
              style={{ transform: zoom ? "scale(2.5)" : "none", transformOrigin: origin, cursor: zoom ? "zoom-out" : "zoom-in" }}
              onPointerDown={(e) => { if (!zoom) pointTo(e); }}
              onPointerMove={(e) => { if (zoom && e.buttons) pointTo(e); }}
              onClick={(e) => { if (!zoom) pointTo(e as unknown as React.PointerEvent<HTMLElement>); setZoom(!zoom); }}
              draggable={false}
            />
            {images.length > 1 && (
              <>
                <button type="button" aria-label="Photo précédente" className="btn absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 px-3" onClick={() => { setZoom(false); setIndex((index - 1 + images.length) % images.length); }}>←</button>
                <button type="button" aria-label="Photo suivante" className="btn absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 px-3" onClick={() => { setZoom(false); setIndex((index + 1) % images.length); }}>→</button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

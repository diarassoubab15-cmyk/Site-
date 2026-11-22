"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Particules interactives en fond de page (canvas 2D, sans bibliothèque).
 * Elles s'écartent du doigt ou de la souris puis reviennent. Couleur : celle de la page
 * (attribut data-accent le plus proche), sinon la couleur principale du site.
 * Léger pour les petits téléphones : peu de particules, résolution plafonnée, pause quand l'onglet est caché.
 * Mouvement réduit : rien n'est dessiné.
 */
export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accent = (document.querySelector<HTMLElement>("[data-accent]")?.dataset.accent ?? getComputedStyle(document.documentElement).getPropertyValue("--color-iris").trim()) || "#9281f7";
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0;
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };
    let ps: P[] = [];
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(w < 640 ? 34 : 80, (w * h) / 14000));
      ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: 0.8 + Math.random() * 1.8, a: 0.4 + Math.random() * 0.5 }));
    };
    resize();

    const move = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY; };
    const leave = () => { pointer.x = pointer.y = -9999; };
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      for (const p of ps) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120 && d2 > 0.01) { const f = (1 - Math.sqrt(d2) / 120) * 0.6; const d = Math.sqrt(d2); p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
        p.vx *= 0.96; p.vy *= 0.96;
        p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        ctx.globalAlpha = p.a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      // Fils fins entre particules proches du doigt : la zone touchée « s'allume ».
      ctx.lineWidth = 0.6;
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        if (Math.abs(a.x - pointer.x) > 160 || Math.abs(a.y - pointer.y) > 160) continue;
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 90 * 90) { ctx.globalAlpha = 0.35 * (1 - Math.sqrt(d2) / 90); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("pointerup", leave, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", leave);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [pathname]);

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <canvas ref={ref} className="particles" aria-hidden="true" />
    </>
  );
}

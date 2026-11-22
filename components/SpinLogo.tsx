"use client";
import { useEffect, useRef } from "react";

/**
 * Logo NEXORA en motion design, sans 3D ni bibliothèque :
 * - à l'ouverture, l'hexagone et le N se dessinent ;
 * - le cadre tourne lentement, quatre points (les couleurs des quatre pages) gravitent autour ;
 * - au doigt : glisser horizontalement fait tourner tout le logo (l'élan est conservé),
 *   un simple toucher lui fait faire un tour ; il revient toujours droit, avec un ressort.
 * Le défilement vertical de la page reste libre (touch-action: pan-y).
 * Mouvement réduit : logo fixe, dessiné d'emblée.
 */
const DOTS = ["#e3b341", "#9281f7", "#3ad389", "#3b9eff"];

export function SpinLogo({ size = 240 }: { size?: number }) {
  const stage = useRef<HTMLDivElement>(null);
  const spinner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    const rot = spinner.current;
    if (!el || !rot) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Ressort (léger rebond) vers un multiple de 360° : le logo finit toujours droit.
    let angle = 0, vel = 0, target = 0, raf = 0, prev = 0;
    let drag: { x: number; start: number; t: number; moved: number; lastX: number; lastT: number } | null = null;
    const K = 42, C = 10.5;

    const apply = () => { rot.style.transform = `rotate(${angle.toFixed(2)}deg)`; };
    const tick = (t: number) => {
      const dt = Math.min(0.032, prev ? (t - prev) / 1000 : 0.016);
      prev = t;
      if (!drag) {
        vel += (K * (target - angle) - C * vel) * dt;
        angle += vel * dt;
        if (Math.abs(target - angle) < 0.05 && Math.abs(vel) < 0.5) {
          angle = target % 360; target = angle; vel = 0; apply(); raf = 0; prev = 0;
          return;
        }
      }
      apply();
      raf = requestAnimationFrame(tick);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, start: angle, t: performance.now(), moved: 0, lastX: e.clientX, lastT: performance.now() };
      vel = 0;
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-grabbed");
      run();
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const now = performance.now();
      const dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      angle = drag.start + dx * 0.9;
      const dtm = Math.max(1, now - drag.lastT);
      vel = vel * 0.6 + (((e.clientX - drag.lastX) * 0.9) / dtm) * 1000 * 0.4;   // degrés/seconde, lissé
      drag.lastX = e.clientX;
      drag.lastT = now;
    };
    const up = () => {
      if (!drag) return;
      const tap = drag.moved < 6 && performance.now() - drag.t < 300;
      drag = null;
      el.classList.remove("is-grabbed");
      if (tap) {
        target = Math.round(angle / 360) * 360 + 360;   // un tour complet
        el.classList.remove("is-tapped");
        void el.offsetWidth;
        el.classList.add("is-tapped");
      } else {
        // L'élan décide du nombre de tours, puis le ressort ramène le logo droit.
        target = Math.round((angle + vel * 0.32) / 360) * 360;
      }
      run();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      target = Math.round(angle / 360) * 360 + 360;
      run();
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <div
      ref={stage}
      className="spin-stage relative select-none"
      style={{ width: size, height: size }}
      role="button"
      aria-label="Logo NEXORA : touchez-le pour le faire tourner"
      tabIndex={0}
      data-spin-logo
    >
      {/* Halo violet, respiration lente */}
      <div className="spin-halo absolute inset-[-22%] rounded-full" aria-hidden="true" />
      {/* Quatre points en orbite : les couleurs des quatre pages */}
      <div className="spin-orbit absolute inset-[-9%]" style={{ ["--r" as string]: `${Math.round(size * 0.59)}px` }} aria-hidden="true">
        {DOTS.map((c, i) => (
          <span key={c} className="spin-dot" style={{ ["--a" as string]: `${i * 90}deg`, background: c, boxShadow: `0 0 14px ${c}` }} />
        ))}
      </div>
      <div ref={spinner} className="absolute inset-0 will-change-transform" aria-hidden="true">
        <div className="spin-pop h-full w-full">
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" className="overflow-visible">
            <defs>
              {/* Dégradé du logo NEXORA : violet → rose → orange → or */}
              <linearGradient id="sl-edge" x1="3" y1="6" x2="21" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#6a2bff" />
                <stop offset="0.45" stopColor="#c44dff" />
                <stop offset="0.72" stopColor="#ff8a3d" />
                <stop offset="1" stopColor="#ffc21a" />
              </linearGradient>
            </defs>
            {/* Cadre : tourne lentement en continu (CSS) */}
            <g className="spin-frame">
              <path className="spin-draw" pathLength={1} d="M7.25 4.25 12 1.5 21.5 7v10L12 22.5 2.5 17V7l4.75-2.75" stroke="url(#sl-edge)" strokeWidth="1.5" strokeLinejoin="round" />
              <path className="spin-draw spin-draw-2" pathLength={1} d="M8.4 6.28 12 4.2l7.2 4.15v7.3L12 19.8l-7.2-4.15v-7.3l3.6-2.07" stroke="#ff8a3d" strokeOpacity="0.3" strokeWidth="0.3" strokeLinejoin="round" />
            </g>
            {/* N relié à deux « nœuds » : les vendeurs et les clients connectés */}
            <g stroke="url(#sl-edge)" strokeLinecap="round" strokeLinejoin="round">
              <path className="spin-draw spin-draw-3" pathLength={1} d="M7.9 15.3V8.7l7.9 7.2V10.6" strokeWidth="1.9" />
              <path className="spin-draw spin-draw-3" pathLength={1} d="M7.9 15.3 6.6 16.7M15.8 10.6V9.8L17 8.5" strokeWidth="0.75" />
              <circle className="spin-draw spin-draw-3" pathLength={1} cx="5.85" cy="17.45" r="0.95" strokeWidth="0.75" />
              <circle className="spin-draw spin-draw-3" pathLength={1} cx="17.75" cy="7.75" r="0.95" strokeWidth="0.75" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

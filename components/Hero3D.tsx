"use client";
import { useEffect, useRef, useState } from "react";
import { Cube } from "./Cube";

type NavigatorExtra = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };

/** La 3D n'est chargée que sur un appareil capable ; sinon le cube CSS (0 Ko de JavaScript) reste. */
function canRun3D() {
  const n = navigator as NavigatorExtra;
  if (!matchMedia("(min-width: 1024px)").matches) return false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (n.connection?.saveData) return false;
  if (n.connection?.effectiveType && /(^|-)2g|3g/.test(n.connection.effectiveType)) return false;
  if ((n.deviceMemory ?? 8) < 4) return false;
  if ((n.hardwareConcurrency ?? 4) < 4) return false;
  return true;
}

export function Hero3D({ size = 300 }: { size?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canRun3D()) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    // Attend que la page soit calme (après l'écran d'ouverture) pour ne pas gêner le premier affichage.
    const start = () =>
      import("@/lib/hero-scene").then(({ mountHeroScene }) => {
        if (cancelled || !box.current) return;
        dispose = mountHeroScene(box.current, () => setReady(true));
      });
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const timer = window.setTimeout(() => (idle ? idle(start, { timeout: 2000 }) : start()), 1800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      dispose?.();
    };
  }, []);

  return (
    <div ref={box} className={`hero-3d relative ${ready ? "is-ready" : ""}`} style={{ width: size * 1.6, height: size * 1.6 }} aria-hidden="true">
      <div className="absolute inset-0 flex items-center justify-center">
        <Cube size={size * 0.85} />
      </div>
      {/* le canvas Three.js est ajouté ici, en position absolue */}
    </div>
  );
}

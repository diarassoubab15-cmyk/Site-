"use client";
import { useEffect, useRef, useState } from "react";
import { GlassLogo } from "./GlassLogo";

type NavigatorExtra = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };

/** Le verre 3D n'est chargé que sur un appareil capable ; sinon le logo SVG (0 Ko de JavaScript) reste. */
const forced = () => new URLSearchParams(window.location.search).get("verre") === "force";

function canRun3D() {
  // Contrôle visuel : /?verre=force affiche le verre sur n'importe quelle machine, sans surveillance.
  if (forced()) return true;
  const n = navigator as NavigatorExtra;
  if (!matchMedia("(min-width: 1024px)").matches) return false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (n.connection?.saveData) return false;
  if (n.connection?.effectiveType && /(^|-)2g|3g/.test(n.connection.effectiveType)) return false;
  if ((n.deviceMemory ?? 8) < 4) return false;
  if ((n.hardwareConcurrency ?? 4) < 4) return false;
  return hasRealGpu();
}

/** Écarte les ordinateurs sans vraie carte graphique (rendu logiciel) : le verre y serait saccadé. */
function hasRealGpu() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
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
        dispose = mountHeroScene(
          box.current,
          () => setReady(true),
          () => {
            // Appareil trop lent pour le verre : retour en fondu au logo SVG, puis tout est libéré.
            setReady(false);
            window.setTimeout(() => {
              dispose?.();
              dispose = undefined;
            }, 700);
          },
          !forced(),
        );
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
        <GlassLogo size={size * 0.85} />
      </div>
      {/* le canvas Three.js est ajouté ici, en position absolue */}
    </div>
  );
}

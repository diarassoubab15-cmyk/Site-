"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

/**
 * Le logo NEXORA qui arrive en tournant en haut de chaque page, comme sur Award.
 * Il prend la couleur de la page (attribut data-accent) et refait un tour quand on le touche.
 * Absent de l'accueil (grand logo) et d'Award (son propre logo or).
 */
export function PageMark() {
  const pathname = usePathname();
  const [color, setColor] = useState<string | null>(null);
  const [spins, setSpins] = useState(0);
  useEffect(() => {
    setColor(document.querySelector<HTMLElement>("[data-accent]")?.dataset.accent ?? null);
  }, [pathname]);
  if (pathname === "/" || pathname.startsWith("/award")) return null;
  return (
    <div className="flex justify-center pt-10" aria-hidden="true">
      <button
        type="button"
        tabIndex={-1}
        className="page-mark"
        style={color ? { ["--pm" as string]: color } : undefined}
        onPointerDown={() => setSpins((n) => n + 1)}
      >
        <span key={`${pathname}-${spins}`} className="page-mark-spin"><LogoMark size={60} gid="nx-page" /></span>
      </button>
    </div>
  );
}

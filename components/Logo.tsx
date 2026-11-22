"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Logo NEXORA de l'en-tête : il fait un tour complet à chaque changement de page
 * (comme à l'ouverture d'Award) et quand on appuie dessus.
 * Pour changer de logo : remplacer uniquement le contenu de LogoMark.
 */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 16V8l8 8V8" stroke="var(--color-iris)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  const pathname = usePathname();
  const [taps, setTaps] = useState(0);
  return (
    <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="NEXORA, accueil" onPointerDown={() => setTaps((t) => t + 1)}>
      <span key={`${pathname}-${taps}`} className="logo-spin inline-flex"><LogoMark /></span>
      <span className="text-[15px] font-semibold tracking-[0.18em]">NEXORA</span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Logo NEXORA (hexagone et N relié à deux nœuds, dégradé violet → or), dessiné en vectoriel :
 * net à toutes les tailles et léger à animer. `gid` : identifiant unique du dégradé dans la page.
 */
export function LogoMark({ size = 22, gid = "nx-logo" }: { size?: number; gid?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="3" y1="6" x2="21" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6a2bff" />
          <stop offset="0.45" stopColor="#c44dff" />
          <stop offset="0.72" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#ffc21a" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gid})`} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1.6 21.2 6.9v10.2L12 22.4l-9.2-5.3V6.9L12 1.6Z" strokeWidth="1.9" />
        <path d="M7.9 15.3V8.7l7.9 7.2V10.6" strokeWidth="2.1" />
        <path d="M7.9 15.3 6.6 16.7M15.8 10.6V9.8L17 8.5" strokeWidth="0.9" />
        <circle cx="5.85" cy="17.45" r="1" strokeWidth="0.9" />
        <circle cx="17.75" cy="7.75" r="1" strokeWidth="0.9" />
      </g>
    </svg>
  );
}

/**
 * Logo de l'en-tête : il fait un tour complet à chaque changement de page et quand on appuie dessus.
 */
export function Logo({ gid = "nx-head" }: { gid?: string }) {
  const pathname = usePathname();
  const [taps, setTaps] = useState(0);
  return (
    <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="NEXORA, accueil" onPointerDown={() => setTaps((t) => t + 1)}>
      <span key={`${pathname}-${taps}`} className="logo-spin inline-flex"><LogoMark size={26} gid={gid} /></span>
      <span className="text-[15px] font-semibold tracking-[0.18em]">NEXORA</span>
    </Link>
  );
}

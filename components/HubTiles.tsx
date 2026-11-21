"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HUB_EXTRA, HUB_PAGES, type HubPage } from "@/lib/hub";
import { supabaseEnabled } from "@/lib/supabase/env";
import { getHubRoles } from "@/app/actions";

/** Icône animée propre à chaque page (transform et opacité seulement ; à l'arrêt en mouvement réduit). */
function TileIcon({ id }: { id: HubPage["id"] }) {
  const common = { width: 44, height: 44, viewBox: "0 0 44 44", fill: "none", "aria-hidden": true } as const;
  switch (id) {
    case "award": // médaille qui scintille
      return (
        <svg {...common} className="ti ti-award">
          <path d="M15 4h14l-4 12h-6L15 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="22" cy="27" r="11" stroke="currentColor" strokeWidth="1.5" />
          <path className="ti-star" d="m22 20.5 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6 1.9-3.9Z" fill="currentColor" />
          <rect className="ti-shine" x="10" y="14" width="5" height="26" fill="#fff" opacity="0.5" />
        </svg>
      );
    case "categories": // quatre carrés qui changent de place
      return (
        <svg {...common} className="ti ti-cat">
          <rect className="ti-sq ti-sq1" x="7" y="7" width="12" height="12" rx="3" fill="currentColor" />
          <rect className="ti-sq ti-sq2" x="25" y="7" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <rect className="ti-sq ti-sq3" x="25" y="25" width="12" height="12" rx="3" fill="currentColor" opacity="0.55" />
          <rect className="ti-sq ti-sq4" x="7" y="25" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "creer": // vitrine + « + » qui apparaît
      return (
        <svg {...common} className="ti ti-shop">
          <path d="M6 16 9 7h26l3 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path className="ti-awning" pathLength={1} d="M6 16c0 2.5 2 4 4 4s4-1.5 4-4c0 2.5 2 4 4 4s4-1.5 4-4c0 2.5 2 4 4 4s4-1.5 4-4c0 2.5 2 4 4 4s4-1.5 4-4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 21v16h26V21" stroke="currentColor" strokeWidth="1.5" />
          <g className="ti-plus"><path d="M22 25v8M18 29h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></g>
        </svg>
      );
    case "reglages": // engrenage qui tourne + interrupteur
      return (
        <svg {...common} className="ti ti-gear">
          <g className="ti-cog">
            <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M16 6v3M16 23v3M6 16h3M23 16h3M8.9 8.9l2.1 2.1M21 21l2.1 2.1M8.9 23.1 11 21M21 11l2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <rect x="8" y="30" width="28" height="10" rx="5" stroke="currentColor" strokeWidth="1.5" />
          <circle className="ti-knob" cx="13" cy="35" r="3" fill="currentColor" />
        </svg>
      );
    case "boutique": // barres de ventes qui montent
      return (
        <svg {...common} className="ti ti-bars">
          <path d="M6 38h32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <rect className="ti-bar ti-bar1" x="9" y="22" width="6" height="16" rx="1.5" fill="currentColor" opacity="0.5" />
          <rect className="ti-bar ti-bar2" x="19" y="14" width="6" height="24" rx="1.5" fill="currentColor" opacity="0.75" />
          <rect className="ti-bar ti-bar3" x="29" y="7" width="6" height="31" rx="1.5" fill="currentColor" />
        </svg>
      );
    case "admin": // bouclier qui se coche
      return (
        <svg {...common} className="ti ti-shield">
          <path d="M22 5 36 10v10c0 9-6 15.5-14 19C14 35.5 8 29 8 20V10l14-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path className="ti-check" pathLength={1} d="m15 21 5 5 9-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function Tile({ p, onAward }: { p: HubPage; onAward?: (e: React.MouseEvent) => void }) {
  return (
    <Link
      href={p.href}
      onClick={onAward}
      className="hub-tile group"
      style={{ ["--c" as string]: p.color, ["--cl" as string]: p.light }}
      data-haptic
      data-hub={p.id}
    >
      <span className="hub-glow" aria-hidden="true" />
      <span className="hub-icon"><TileIcon id={p.id} /></span>
      <span className="mt-auto block">
        <span className="hub-title">{p.title}</span>
        <span className="mt-2 block text-sm leading-relaxed text-ash">{p.text}</span>
      </span>
      <span className="hub-arrow" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </Link>
  );
}

/**
 * Transition vers Award : le logo tourne sur lui-même en passant à l'or, une onde dorée se propage,
 * puis la page noire et or s'ouvre. ~0,9 s ; directe en mouvement réduit ou avec Ctrl/⌘ (nouvel onglet).
 */
function AwardCurtain() {
  return createPortal(
    <div className="award-curtain" role="presentation">
      <div className="award-wave" />
      <div className="award-coin">
        <svg viewBox="0 0 24 24" width="120" height="120" fill="none" className="award-coin-face">
          <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z" stroke="#f6d77a" strokeWidth="1.15" strokeLinejoin="round" />
          <path d="M8 16V8l8 8V8" stroke="#e3b341" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>,
    document.body,
  );
}

export function HubTiles() {
  const router = useRouter();
  const [extra, setExtra] = useState<HubPage[]>([]);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch("/award");
    if (!supabaseEnabled) return;
    let alive = true;
    getHubRoles().then((r) => {
      if (!alive || !r.ok || !r.data) return;
      const list: HubPage[] = [];
      if (r.data.seller) list.push(HUB_EXTRA.boutique);
      if (r.data.admin) list.push(HUB_EXTRA.admin);
      setExtra(list);
    }).catch(() => {});
    return () => { alive = false; };
  }, [router]);

  function toAward(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    setLeaving(true);
    setTimeout(() => router.push("/award"), 900);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2" data-reveal suppressHydrationWarning>
        {HUB_PAGES.map((p) => <Tile key={p.id} p={p} onAward={p.id === "award" ? toAward : undefined} />)}
        {extra.map((p) => <Tile key={p.id} p={p} />)}
      </div>
      {leaving && <AwardCurtain />}
    </>
  );
}

/**
 * Icône animée propre à chaque type de boutique (SVG en ligne, transform et opacité seulement).
 * L'animation démarre quand l'icône est visible ([data-in] posé au défilement) ; arrêtée en mouvement réduit.
 */
export function ShopTypeIcon({ slug, size = 48 }: { slug: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", "aria-hidden": true } as const;
  const s = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (slug) {
    case "mode": // cintre qui se balance
      return (
        <svg {...p} className="st st-mode">
          <g className="st-swing">
            <path {...s} d="M24 8a3 3 0 1 1 3 3c-1.6 0-3 1-3 2.6V16" />
            <path {...s} d="M24 16 7 29c-1.6 1.2-.8 3.6 1.2 3.6h31.6c2 0 2.8-2.4 1.2-3.6L24 16Z" />
          </g>
          <path className="st-cloth" d="M14 33h20l-2 9H16l-2-9Z" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case "electronique": // manette, boutons qui clignotent
      return (
        <svg {...p} className="st st-tech">
          <path {...s} d="M14 16h20c5 0 8 4 9 10l1 6c.5 3.5-3.4 5.6-5.8 3.1L33 30H15l-5.2 5.1C7.4 37.6 3.5 35.5 4 32l1-6c1-6 4-10 9-10Z" />
          <path {...s} d="M14 21v6M11 24h6" />
          <circle className="st-btn st-btn1" cx="32" cy="22" r="1.8" fill="currentColor" />
          <circle className="st-btn st-btn2" cx="36" cy="26" r="1.8" fill="currentColor" />
        </svg>
      );
    case "immobilier": // maison dont la fenêtre s'allume
      return (
        <svg {...p} className="st st-home">
          <path {...s} d="M6 22 24 8l18 14" />
          <path {...s} d="M10 19v21h28V19" />
          <rect className="st-window" x="15" y="24" width="8" height="7" rx="1" fill="currentColor" />
          <path {...s} d="M28 40v-9h6v9" />
          <circle className="st-sun" cx="40" cy="9" r="3" fill="currentColor" />
        </svg>
      );
    case "automobile": // voiture : roues qui tournent, route qui défile
      return (
        <svg {...p} className="st st-car">
          <g className="st-road"><path {...s} d="M2 44h6M14 44h6M26 44h6M38 44h6" /></g>
          <path {...s} d="M6 33v-6l5-9h22l7 9h2v6h-4M14 33h16" />
          <path {...s} d="M13 27h26M22 18v9" />
          <g className="st-wheel st-wheel1"><circle {...s} cx="10" cy="34" r="4" /><path {...s} d="M10 31v6" /></g>
          <g className="st-wheel st-wheel2"><circle {...s} cx="34" cy="34" r="4" /><path {...s} d="M34 31v6" /></g>
        </svg>
      );
    case "maison": // canapé, coussins qui rebondissent
      return (
        <svg {...p} className="st st-sofa">
          <path {...s} d="M8 24v-6a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v6" />
          <path {...s} d="M5 26a3 3 0 0 1 6 0v4h26v-4a3 3 0 0 1 6 0v10H5V26Z" />
          <path {...s} d="M9 36v4M39 36v4" />
          <rect className="st-cushion st-cushion1" x="13" y="20" width="9" height="7" rx="2.5" fill="currentColor" opacity="0.6" />
          <rect className="st-cushion st-cushion2" x="26" y="20" width="9" height="7" rx="2.5" fill="currentColor" opacity="0.6" />
        </svg>
      );
    case "beaute": // flacon et étincelles
      return (
        <svg {...p} className="st st-beauty">
          <path {...s} d="M20 6h8v6h-8zM18 12h12l2 6v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V18l2-6Z" />
          <path className="st-fill" d="M17 26h14v12a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V26Z" fill="currentColor" opacity="0.45" />
          <path className="st-spark st-spark1" d="m39 10 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" fill="currentColor" />
          <path className="st-spark st-spark2" d="m8 20 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" fill="currentColor" />
        </svg>
      );
    case "alimentation": // panier, un fruit tombe dedans
      return (
        <svg {...p} className="st st-basket">
          <circle className="st-fruit" cx="24" cy="12" r="4" fill="currentColor" />
          <path {...s} d="M6 22h36l-4 18H10L6 22Z" />
          <path {...s} d="M14 22l6-10M34 22l-6-10M17 28v6M24 28v6M31 28v6" />
        </svg>
      );
    case "gros": // cartons qui s'empilent
      return (
        <svg {...p} className="st st-boxes">
          <rect {...s} x="6" y="28" width="16" height="14" rx="1.5" />
          <rect {...s} x="26" y="28" width="16" height="14" rx="1.5" />
          <g className="st-drop"><rect x="16" y="10" width="16" height="14" rx="1.5" fill="currentColor" opacity="0.55" /><path d="M24 10v5" stroke="#000" strokeWidth="1.6" /></g>
        </svg>
      );
    default:
      return <svg {...p}><circle {...s} cx="24" cy="24" r="14" /></svg>;
  }
}

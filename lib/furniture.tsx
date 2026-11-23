/**
 * Meubles dessinés (vue de face) pour l'outil « Aménager ma maison ».
 * Ils servent quand un produit n'a pas encore de photo, et pour essayer une idée avant de choisir un vendeur.
 * Chaque type a des mots-clés : un produit « Canapé 3 places en wax » est reconnu comme un canapé.
 */
import type { ReactElement } from "react";

export type FurnitureType = {
  id: string;
  name: string;
  /** Largeur par défaut, en % de la largeur de la pièce. */
  width: number;
  /** Rapport hauteur / largeur du dessin. */
  ratio: number;
  /** Posé au sol (true) ou accroché au mur (false) : position de départ. */
  floor: boolean;
  keywords: string[];
  draw: (c: string) => ReactElement;
};

const wood = "#a0693b";
const woodDark = "#7a4a24";

export const FURNITURE: FurnitureType[] = [
  {
    id: "canape", name: "Canapé", width: 42, ratio: 0.45, floor: true, keywords: ["canape", "sofa", "divan"],
    draw: (c) => (
      <svg viewBox="0 0 200 90">
        <rect x="18" y="8" width="164" height="46" rx="14" fill={c} />
        <rect x="4" y="34" width="30" height="44" rx="12" fill={c} filter="brightness(0.9)" />
        <rect x="166" y="34" width="30" height="44" rx="12" fill={c} />
        <rect x="26" y="46" width="148" height="28" rx="8" fill={c} opacity="0.85" />
        <path d="M100 48v26" stroke="#000" strokeOpacity=".12" strokeWidth="2" />
        <rect x="14" y="78" width="6" height="10" fill={woodDark} /><rect x="180" y="78" width="6" height="10" fill={woodDark} />
      </svg>
    ),
  },
  {
    id: "fauteuil", name: "Fauteuil", width: 20, ratio: 0.95, floor: true, keywords: ["fauteuil", "siege", "bergere"],
    draw: (c) => (
      <svg viewBox="0 0 100 95">
        <rect x="16" y="6" width="68" height="52" rx="16" fill={c} />
        <rect x="4" y="38" width="22" height="42" rx="10" fill={c} />
        <rect x="74" y="38" width="22" height="42" rx="10" fill={c} />
        <rect x="22" y="52" width="56" height="24" rx="8" fill={c} opacity="0.85" />
        <rect x="12" y="80" width="5" height="14" fill={woodDark} /><rect x="83" y="80" width="5" height="14" fill={woodDark} />
      </svg>
    ),
  },
  {
    id: "table-basse", name: "Table basse", width: 24, ratio: 0.32, floor: true, keywords: ["table basse", "table de salon"],
    draw: () => (
      <svg viewBox="0 0 120 38">
        <rect x="2" y="2" width="116" height="10" rx="4" fill={wood} />
        <rect x="12" y="12" width="7" height="24" fill={woodDark} /><rect x="101" y="12" width="7" height="24" fill={woodDark} />
        <rect x="18" y="22" width="84" height="4" fill={woodDark} opacity=".6" />
      </svg>
    ),
  },
  {
    id: "table", name: "Table à manger", width: 34, ratio: 0.42, floor: true, keywords: ["table a manger", "table", "bureau"],
    draw: () => (
      <svg viewBox="0 0 160 66">
        <rect x="2" y="2" width="156" height="10" rx="3" fill={wood} />
        <rect x="10" y="12" width="8" height="52" fill={woodDark} /><rect x="142" y="12" width="8" height="52" fill={woodDark} />
      </svg>
    ),
  },
  {
    id: "chaise", name: "Chaise", width: 10, ratio: 1.9, floor: true, keywords: ["chaise", "tabouret"],
    draw: (c) => (
      <svg viewBox="0 0 50 95">
        <rect x="8" y="2" width="34" height="44" rx="6" fill={c} />
        <rect x="4" y="46" width="42" height="9" rx="3" fill={wood} />
        <rect x="7" y="55" width="5" height="38" fill={woodDark} /><rect x="38" y="55" width="5" height="38" fill={woodDark} />
      </svg>
    ),
  },
  {
    id: "lit", name: "Lit", width: 46, ratio: 0.48, floor: true, keywords: ["lit", "matelas", "sommier"],
    draw: (c) => (
      <svg viewBox="0 0 200 96">
        <rect x="4" y="2" width="192" height="44" rx="10" fill={woodDark} />
        <rect x="10" y="40" width="180" height="40" rx="8" fill="#f6f2ea" />
        <rect x="24" y="30" width="56" height="20" rx="8" fill="#fff" stroke="#e6dfd2" />
        <rect x="120" y="30" width="56" height="20" rx="8" fill="#fff" stroke="#e6dfd2" />
        <rect x="10" y="56" width="180" height="26" rx="6" fill={c} />
        <rect x="6" y="80" width="188" height="8" rx="3" fill={wood} />
        <rect x="10" y="88" width="7" height="7" fill={woodDark} /><rect x="183" y="88" width="7" height="7" fill={woodDark} />
      </svg>
    ),
  },
  {
    id: "armoire", name: "Armoire", width: 24, ratio: 1.75, floor: true, keywords: ["armoire", "penderie", "placard", "dressing"],
    draw: () => (
      <svg viewBox="0 0 100 175">
        <rect x="2" y="2" width="96" height="164" rx="4" fill={wood} />
        <path d="M50 8v152" stroke={woodDark} strokeWidth="2" />
        <rect x="42" y="78" width="3" height="16" rx="1.5" fill="#e8d3a8" /><rect x="55" y="78" width="3" height="16" rx="1.5" fill="#e8d3a8" />
        <rect x="8" y="166" width="8" height="8" fill={woodDark} /><rect x="84" y="166" width="8" height="8" fill={woodDark} />
      </svg>
    ),
  },
  {
    id: "meuble-tv", name: "Meuble TV", width: 36, ratio: 0.62, floor: true, keywords: ["meuble tv", "television", "tv", "commode", "buffet", "console"],
    draw: () => (
      <svg viewBox="0 0 160 100">
        <rect x="30" y="2" width="100" height="58" rx="4" fill="#16161c" />
        <rect x="35" y="7" width="90" height="48" rx="2" fill="#2b3a55" />
        <rect x="74" y="60" width="12" height="6" fill="#16161c" />
        <rect x="2" y="66" width="156" height="28" rx="4" fill={wood} />
        <path d="M54 70v20M106 70v20" stroke={woodDark} strokeWidth="2" />
        <rect x="8" y="94" width="6" height="6" fill={woodDark} /><rect x="146" y="94" width="6" height="6" fill={woodDark} />
      </svg>
    ),
  },
  {
    id: "etagere", name: "Étagère", width: 20, ratio: 1.6, floor: true, keywords: ["etagere", "bibliotheque", "rangement"],
    draw: () => (
      <svg viewBox="0 0 100 160">
        <rect x="2" y="2" width="6" height="156" fill={woodDark} /><rect x="92" y="2" width="6" height="156" fill={woodDark} />
        {[4, 52, 100, 148].map((y) => <rect key={y} x="2" y={y} width="96" height="6" fill={wood} />)}
        <rect x="14" y="26" width="8" height="26" fill="#5433eb" /><rect x="24" y="30" width="8" height="22" fill="#e7a33e" /><rect x="34" y="24" width="7" height="28" fill="#12995a" />
        <circle cx="70" cy="88" r="10" fill="#c9cbd3" /><rect x="58" y="120" width="28" height="28" rx="4" fill="#d9b48f" />
      </svg>
    ),
  },
  {
    id: "lampe", name: "Lampadaire", width: 9, ratio: 3.6, floor: true, keywords: ["lampe", "lampadaire", "luminaire", "eclairage"],
    draw: () => (
      <svg viewBox="0 0 40 144">
        <path d="M6 30 L12 2 h16 L34 30z" fill="#f4e3c3" />
        <rect x="18" y="30" width="4" height="104" fill="#3a3d44" />
        <ellipse cx="20" cy="138" rx="14" ry="5" fill="#3a3d44" />
      </svg>
    ),
  },
  {
    id: "plante", name: "Plante", width: 11, ratio: 1.8, floor: true, keywords: ["plante", "pot", "fleur"],
    draw: () => (
      <svg viewBox="0 0 60 108">
        <path d="M30 70 C10 50 6 26 14 8 C24 26 28 44 30 70 C32 40 40 20 52 6 C58 30 48 52 30 70z" fill="#2f8f4e" />
        <path d="M30 70 C18 60 4 58 2 44 C16 44 26 54 30 70z" fill="#3fae62" />
        <path d="M14 70 h32 l-5 36 h-22z" fill="#c0703c" />
      </svg>
    ),
  },
  {
    id: "tapis", name: "Tapis", width: 46, ratio: 0.18, floor: true, keywords: ["tapis", "natte", "kilim"],
    draw: (c) => (
      <svg viewBox="0 0 200 36">
        <path d="M24 2 h152 l22 32 H2z" fill={c} />
        <path d="M36 9 h128 l13 19 H23z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeDasharray="6 5" />
      </svg>
    ),
  },
  {
    id: "tableau", name: "Tableau / déco murale", width: 18, ratio: 0.75, floor: false, keywords: ["tableau", "cadre", "miroir", "toile", "masque", "bogolan", "deco"],
    draw: (c) => (
      <svg viewBox="0 0 100 75">
        <rect x="2" y="2" width="96" height="71" rx="2" fill={woodDark} />
        <rect x="8" y="8" width="84" height="59" fill="#f3e6d0" />
        <path d="M8 56 L34 30 L52 48 L66 36 L92 60 V67 H8z" fill={c} opacity=".85" />
        <circle cx="70" cy="22" r="7" fill="#e7a33e" />
      </svg>
    ),
  },
  {
    id: "panier", name: "Panier / vannerie", width: 11, ratio: 1, floor: true, keywords: ["panier", "vannerie", "corbeille", "tresse"],
    draw: () => (
      <svg viewBox="0 0 60 60">
        <path d="M6 14 h48 l-6 44 H12z" fill="#d6a85f" />
        {[22, 32, 42, 52].map((y) => <path key={y} d={`M8 ${y} h44`} stroke="#a87a35" strokeWidth="2" />)}
        <path d="M18 14 q12 -14 24 0" fill="none" stroke="#7a4a24" strokeWidth="3" />
      </svg>
    ),
  },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Type de meuble d'un produit, d'après son nom puis sa description (« Table basse » avant « Table »). */
export function furnitureTypeOf(text: string): FurnitureType | null {
  const t = norm(text);
  let best: FurnitureType | null = null;
  let len = 0;
  for (const f of FURNITURE) for (const k of f.keywords) if (k.length > len && new RegExp(`\\b${k}`).test(t)) { best = f; len = k.length; }
  return best;
}

/** Teintes proposées pour les tissus. */
export const FABRICS = ["#5433eb", "#c2410c", "#12995a", "#b7791f", "#1f2937", "#d9a7a0"];

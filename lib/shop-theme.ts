/**
 * Apparence des boutiques (listes fermées, les mêmes que dans la base, migration 0014).
 * Pro : couleur de marque + en-tête animé. Ultra : en plus, animation signature et police.
 */
export const BRAND_COLORS = [
  { hex: "#ff5fa2", name: "Rose" }, { hex: "#ff6b6b", name: "Corail" }, { hex: "#ff9f43", name: "Orange" },
  { hex: "#e3b341", name: "Or" }, { hex: "#84cc16", name: "Citron vert" }, { hex: "#3ad389", name: "Émeraude" },
  { hex: "#22d3ee", name: "Turquoise" }, { hex: "#3b9eff", name: "Bleu" }, { hex: "#9281f7", name: "Violet" },
  { hex: "#e879f9", name: "Orchidée" },
] as const;

export const SIGNATURES = [
  { id: "vague", name: "Vague", text: "Des vagues qui ondulent doucement" },
  { id: "constellation", name: "Constellation", text: "Des points qui scintillent et tournent" },
  { id: "ruban", name: "Ruban", text: "Des rubans de lumière qui glissent" },
  { id: "pulsation", name: "Pulsation", text: "Des ondes qui partent du centre" },
] as const;

export const FONTS = [
  { id: "serif", name: "Élégante", css: "var(--font-display)", weight: 400 },
  { id: "sans", name: "Moderne", css: "var(--font-sans)", weight: 600 },
  { id: "mono", name: "Technique", css: "var(--font-mono)", weight: 500 },
] as const;

export type Signature = (typeof SIGNATURES)[number]["id"];
export type DisplayFont = (typeof FONTS)[number]["id"];
export type Tier = "essentiel" | "pro" | "business";
export const tierLabel = (t: Tier | null) => (t === "business" ? "Ultra" : t === "pro" ? "Pro" : "Base");

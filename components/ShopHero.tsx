import { FONTS, type Signature, type Tier } from "@/lib/shop-theme";

/**
 * En-tête animé d'une boutique, en motion design (aucune 3D, aucune bibliothèque) :
 * - Pro : couleur de la marque, monogramme qui se dessine, nom révélé lettre par lettre, halo qui dérive ;
 * - Ultra (Vitrine Ultra) : en plus, plein écran, animation signature au choix et police de la marque.
 * Le texte reste un vrai titre (lisible par les lecteurs d'écran et Google) ; tout est fixe en mouvement réduit.
 */
export function ShopHero({
  name, tagline, place, typeName, color, tier, signature, font, verified,
}: {
  name: string; tagline?: string; place: string; typeName?: string; color: string; tier: Tier;
  signature?: Signature; font?: string; verified: boolean;
}) {
  const ultra = tier === "business";
  const f = FONTS.find((x) => x.id === font) ?? FONTS[0];
  const letters = [...name];
  return (
    <header
      className={`shop-hero ${ultra ? "is-ultra" : ""}`}
      style={{ ["--b" as string]: color, ["--hf" as string]: ultra ? f.css : "var(--font-display)", ["--hw" as string]: ultra ? f.weight : 400 }}
      data-shop-hero={ultra ? "ultra" : "pro"}
    >
      <div className="shop-hero-bg" aria-hidden="true">
        <span className="shop-hero-glow" />
        {ultra && signature && <SignatureArt id={signature} />}
      </div>
      <div className="relative z-[1] flex flex-col items-center text-center">
        <svg className="shop-monogram" viewBox="0 0 80 80" width="76" height="76" aria-hidden="true">
          <circle className="shop-monogram-ring" cx="40" cy="40" r="36" pathLength={1} />
          <text x="40" y="40" dy="0.36em" textAnchor="middle">{name.trim().charAt(0).toUpperCase()}</text>
        </svg>
        {typeName && <p className="shop-hero-kicker">{typeName}{ultra ? " · Vitrine Ultra" : ""}</p>}
        <h1 className="shop-hero-name" aria-label={name}>
          {letters.map((ch, i) => (
            <span key={i} className="shop-letter" style={{ animationDelay: `${220 + i * 38}ms` }} aria-hidden="true">{ch === " " ? " " : ch}</span>
          ))}
        </h1>
        {tagline && <p className="shop-hero-tagline">{tagline}</p>}
        <p className="shop-hero-meta">{place}{verified ? " · ✓ vendeur vérifié" : ""}</p>
      </div>
    </header>
  );
}

/** Les 4 animations signature de la Vitrine Ultra. */
function SignatureArt({ id }: { id: Signature }) {
  if (id === "vague") {
    return (
      <svg className="sig sig-vague" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <path key={i} className={`sig-wave sig-wave-${i}`} d="M0 260 C150 200 300 320 450 260 S750 200 900 260 S1200 320 1350 260 S1650 200 1800 260 S2100 320 2400 260 V400 H0 Z" />
        ))}
      </svg>
    );
  }
  if (id === "constellation") {
    // Positions fixes (rendu identique serveur / navigateur)
    const pts = [[8, 22], [17, 64], [26, 38], [33, 80], [41, 18], [48, 56], [57, 30], [63, 72], [71, 46], [78, 14], [84, 60], [92, 34], [12, 88], [52, 90], [88, 84], [36, 52], [68, 10], [22, 12]];
    return (
      <svg className="sig sig-stars" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g className="sig-stars-turn">
          {pts.map(([x, y], i) => <circle key={i} className="sig-star" cx={x} cy={y} r={i % 3 === 0 ? 0.9 : 0.55} style={{ animationDelay: `${(i * 0.37) % 3}s` }} />)}
          <path className="sig-link" d="M8 22 L26 38 L41 18 L57 30 L71 46 L92 34 M17 64 L48 56 L63 72 L84 60" />
        </g>
      </svg>
    );
  }
  if (id === "ruban") {
    return (
      <div className="sig sig-ribbons" aria-hidden="true">
        {[0, 1, 2].map((i) => <span key={i} className={`sig-ribbon sig-ribbon-${i}`} />)}
      </div>
    );
  }
  return (
    <div className="sig sig-pulse" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => <span key={i} className="sig-ring" style={{ animationDelay: `${i * 1.1}s` }} />)}
    </div>
  );
}

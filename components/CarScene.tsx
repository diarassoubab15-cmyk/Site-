/**
 * Scène animée de la catégorie Automobile : une berline roule en ville (roues qui tournent, route et
 * immeubles qui défilent en parallaxe, phares), une moto la double de temps en temps.
 * SVG + CSS seulement (transform), aucune image : léger sur les petits téléphones.
 * Mouvement réduit demandé par le système : scène figée.
 */
function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g className="car-wheel" style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={r} fill="#16161c" />
      <circle cx={cx} cy={cy} r={r * 0.58} fill="#c9cbd3" />
      {[0, 60, 120].map((a) => (
        <rect key={a} x={cx - r * 0.07} y={cy - r * 0.55} width={r * 0.14} height={r * 1.1} rx={r * 0.05} fill="#7c7f8a" transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.16} fill="#3a3d44" />
    </g>
  );
}

function Skyline({ color, offset = 0 }: { color: string; offset?: number }) {
  const blocks = [[0, 70], [46, 110], [96, 82], [150, 140], [196, 96], [250, 120], [300, 74], [344, 130], [398, 88], [452, 104], [500, 66], [548, 118], [600, 92], [652, 134], [702, 80], [750, 112]];
  return (
    <g fill={color}>
      {blocks.map(([x, h], i) => (
        <g key={i}>
          <rect x={x + offset} y={200 - h} width={42} height={h} rx={3} />
          {h > 90 && [0, 1, 2].map((r) => <rect key={r} x={x + offset + 8} y={200 - h + 14 + r * 22} width={8} height={8} rx={1.5} fill="#fff" opacity={0.55} className="car-window" style={{ animationDelay: `${(i * 0.7 + r) % 5}s` }} />)}
        </g>
      ))}
    </g>
  );
}

export function CarScene({ color = "#d97706" }: { color?: string }) {
  return (
    <div className="car-scene" role="img" aria-label="Animation : une voiture roule en ville">
      <svg viewBox="0 0 800 280" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <defs>
          <linearGradient id="car-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4e6" />
            <stop offset="1" stopColor="#ffe2c2" />
          </linearGradient>
          <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={`color-mix(in srgb, ${color} 70%, #000)`} />
          </linearGradient>
          <radialGradient id="car-beam" cx="0" cy="0.5" r="1">
            <stop offset="0" stopColor="#fff7c2" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="280" fill="url(#car-sky)" />
        <circle cx="640" cy="70" r="34" fill="#ffc46b" opacity="0.8" className="car-sun" />
        {/* Deux plans d'immeubles, chacun doublé pour boucler sans saut */}
        <g className="car-layer car-far"><Skyline color="#f3c9a0" /><Skyline color="#f3c9a0" offset={800} /></g>
        <g className="car-layer car-near"><Skyline color="#e9a873" offset={-20} /><Skyline color="#e9a873" offset={780} /></g>
        {/* Route */}
        <rect y="200" width="800" height="80" fill="#2d2f36" />
        <rect y="200" width="800" height="6" fill="#c7c9cf" />
        <g className="car-layer car-road">
          {Array.from({ length: 20 }, (_, i) => <rect key={i} x={i * 80} y="240" width="44" height="5" rx="2.5" fill="#f5f5f7" />)}
        </g>
        {/* Moto qui double */}
        <g className="car-moto">
          <rect x="0" y="206" width="50" height="6" rx="3" fill="#5433eb" />
          <path d="M14 206 l10 -16 h12 l8 16z" fill="#16161c" />
          <circle cx="30" cy="186" r="7" fill="#5433eb" />
          <Wheel cx={6} cy={214} r={9} />
          <Wheel cx={46} cy={214} r={9} />
        </g>
        {/* Berline */}
        <g className="car-body">
          <ellipse cx="400" cy="246" rx="150" ry="9" fill="#000" opacity="0.28" />
          <path d="M268 222 q-6 -32 26 -38 l52 -8 q36 -36 92 -38 q52 0 84 34 l52 8 q34 6 34 30 v14 h-340z" fill="url(#car-body)" />
          <path d="M362 176 q30 -26 74 -26 q40 0 62 26z" fill="#cfe3ff" opacity="0.92" />
          <rect x="430" y="150" width="6" height="28" fill={`color-mix(in srgb, ${color} 70%, #000)`} />
          <rect x="604" y="206" width="16" height="8" rx="3" fill="#fff3b0" />
          <rect x="268" y="208" width="12" height="8" rx="3" fill="#ff4d4d" />
          <path d="M620 200 L800 160 L800 260 L620 220z" fill="url(#car-beam)" className="car-beam" />
          <Wheel cx={330} cy={232} r={24} />
          <Wheel cx={548} cy={232} r={24} />
        </g>
      </svg>
    </div>
  );
}

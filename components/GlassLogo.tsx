/**
 * Logo NEXORA « verre » en SVG pur (0 Ko de JavaScript) : affiché sur téléphone et appareil modeste,
 * et pendant le chargement de la version 3D, qui vient ensuite se fondre par-dessus.
 */
export function GlassLogo({ size = 260 }: { size?: number }) {
  return (
    <div className="glass-logo relative flex items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">
      <div className="absolute inset-[-30%] rounded-full" style={{ background: "radial-gradient(circle, rgba(146,129,247,0.28) 0%, rgba(146,129,247,0.06) 40%, transparent 70%)" }} />
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className="glass-float relative">
        <defs>
          <linearGradient id="gl-edge" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#c9d4ff" stopOpacity="0.35" />
            <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="1" stopColor="#baa7ff" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="gl-n" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#d9d1ff" />
            <stop offset="0.5" stopColor="#9281f7" />
            <stop offset="1" stopColor="#6d5ae0" />
          </linearGradient>
          <filter id="gl-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z" stroke="url(#gl-edge)" strokeWidth="2.3" strokeLinejoin="round" />
        <path d="M12 2.6 20.5 7.5" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.35" strokeLinecap="round" />
        <path d="M8 16V8l8 8V8" stroke="url(#gl-n)" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" filter="url(#gl-glow)" />
        <path d="M8.2 9.2 14.6 15.6" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

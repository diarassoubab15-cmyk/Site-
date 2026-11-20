/**
 * Écran d'ouverture : logo ~1,3 s puis fondu, l'interface arrive en cascade.
 * Tout est piloté par le script intégré (lib/motion-script.ts) et le CSS, sans attendre React :
 * il se termine à l'heure même sur un téléphone lent, et un filet CSS l'efface à 2,4 s quoi qu'il arrive.
 */
export function IntroScreen() {
  return (
    <div id="intro" role="presentation">
      <div className="intro-logo flex flex-col items-center gap-5 text-white">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z" stroke="currentColor" strokeWidth="1" />
          <path d="M8 16V8l8 8V8" stroke="#9281f7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xl font-semibold tracking-[0.3em]">NEXORA</span>
      </div>
      <span className="intro-beam" aria-hidden="true" />
      <button id="intro-skip" type="button" className="absolute bottom-6 right-6 rounded-[6px] px-3 py-2 text-xs text-iron hover:text-white">
        Passer
      </button>
    </div>
  );
}

/** Coche verte qui se dessine : confirmation visuelle d'une action réussie. */
export function SuccessCheck({ size = 28 }: { size?: number }) {
  return (
    <svg className="check-draw shrink-0 text-pulse" width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 14.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

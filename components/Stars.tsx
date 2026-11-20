export function Stars({ value, size = "text-sm" }: { value: number; size?: string }) {
  const full = Math.round(value);
  return (
    <span className={`${size} tracking-[0.1em]`} role="img" aria-label={`${value} sur 5`}>
      <span className="text-amber">{"★".repeat(full)}</span>
      <span className="text-charcoal">{"★".repeat(5 - full)}</span>
    </span>
  );
}

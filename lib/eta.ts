/** Fenêtre de livraison prévue (« entre le 26 et le 28 nov. ») et retard : commande non livrée après la date maximale. */
const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

export function etaLabel(min?: string | null, max?: string | null): string | null {
  if (!min || !max) return null;
  return min === max ? `le ${fmt(min)}` : `entre le ${fmt(min)} et le ${fmt(max)}`;
}

export function isLate(status: string, max?: string | null): boolean {
  if (!max || !["confirmée", "expédiée"].includes(status)) return false;
  return new Date().toISOString().slice(0, 10) > max;
}

/** Fenêtre estimée AVANT la commande : aujourd'hui + délai d'expédition + délai de la zone. */
export function etaPreview(shipDays = 2, daysMin?: number | null, daysMax?: number | null): string {
  const add = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const lo = daysMin ?? 1;
  const hi = Math.max(daysMax ?? lo + 2, lo);
  return etaLabel(add(shipDays + lo), add(shipDays + hi))!;
}

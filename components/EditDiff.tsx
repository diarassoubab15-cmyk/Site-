import { formatPrice } from "@/lib/format";
import type { EditChangesView, EditableFields } from "@/lib/views";

const LABELS: Record<keyof EditChangesView, string> = {
  name: "Nom",
  short: "Accroche",
  description: "Description",
  price: "Prix",
  compareAt: "Prix barré",
  specs: "Caractéristiques",
};

function show(key: keyof EditChangesView, v: unknown): string {
  if (key === "price") return formatPrice(v as number);
  if (key === "compareAt") return v === null || v === undefined ? "aucun" : formatPrice(v as number);
  if (key === "specs") return (v as [string, string][]).map(([k, val]) => `${k} : ${val}`).join(" · ") || "aucune";
  return (v as string | null) || "(vide)";
}

/** Avant → après, champ par champ. Le texte reste du texte (jamais interprété comme HTML). */
export function EditDiff({ changes, current }: { changes: EditChangesView; current: EditableFields }) {
  const keys = (Object.keys(LABELS) as (keyof EditChangesView)[]).filter((k) => k in changes);
  if (!keys.length) return <p className="text-sm text-iron">Aucun changement proposé automatiquement.</p>;
  return (
    <dl className="divide-y divide-line overflow-hidden rounded-[6px] border border-line text-sm">
      {keys.map((k) => (
        <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr]">
          <dt className="text-ash">{LABELS[k]}</dt>
          <dd className="min-w-0 space-y-1">
            <p className="whitespace-pre-line break-words text-iron line-through decoration-iron/60">{show(k, current[k])}</p>
            <p className="whitespace-pre-line break-words text-white">{show(k, changes[k])}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

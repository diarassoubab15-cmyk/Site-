"use client";
import Link from "next/link";
import { useState } from "react";
import { ANNUAL_MONTHS_PAID, allPlans } from "@/lib/plans";
import { formatPrice } from "@/lib/format";

export function PricingTable() {
  const [annual, setAnnual] = useState(false);
  return (
    <>
      <div className="mb-10 inline-flex rounded-[6px] border border-line p-1" role="radiogroup" aria-label="Période de facturation">
        {[false, true].map((a) => (
          <button key={String(a)} role="radio" aria-checked={annual === a} onClick={() => setAnnual(a)} className={`rounded-[4px] px-4 py-1.5 text-sm transition-colors ${annual === a ? "bg-white text-black" : "text-ash hover:text-white"}`}>
            {a ? "Annuel · 2 mois offerts" : "Mensuel"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {allPlans.map((p) => {
          const price = annual ? Math.round((p.monthly * ANNUAL_MONTHS_PAID) / 12 / 100) * 100 : p.monthly;
          return (
            <article key={p.id} className="hub-tile" style={{ ["--c" as string]: p.color, ["--cl" as string]: p.color, gap: 0, minHeight: 0 }} data-plan={p.id}>
              <span className="hub-glow" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-4xl text-white">{p.name}</h2>
                {p.highlighted && <span className="badge text-iris-glow">le plus choisi</span>}
              </div>
              <p className="mt-2 min-h-12 text-sm text-ash">{p.pitch}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-mono text-4xl text-white">{formatPrice(price).replace(" FCFA", "")}</span>
                <span className="text-sm text-ash">FCFA / mois</span>
              </p>
              <p className="mt-1 h-5 text-xs text-iron">{p.monthly === 0 ? "gratuit, sans limite de durée" : annual ? `soit ${formatPrice(p.monthly * ANNUAL_MONTHS_PAID)} par an` : "sans engagement"}</p>
              <p className="mt-6 font-mono text-xs" style={{ color: p.color }}>{p.products}</p>
              <ul className="mt-4 flex-1 space-y-3 text-sm text-bone">
                {p.features.map((f) => (
                  <li key={f.text} className={`flex gap-3 ${f.soon ? "text-ash" : ""}`}>
                    <span style={{ color: f.soon ? undefined : p.color }} className={f.soon ? "text-iron" : ""} aria-hidden="true">{f.soon ? "○" : "✓"}</span>
                    <span>{f.text}{f.soon && <span className="badge ml-2 align-middle text-[10px] text-iron">bientôt</span>}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/vendre?forfait=${p.id}${annual ? "&annuel=1" : ""}`} className={`${p.highlighted ? "btn-solid" : "btn"} mt-8 w-full`}>
                Choisir {p.name}
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { EditChangesView, EditRequestView } from "@/lib/views";
import { adminApplyEdit, adminRejectEdit } from "@/app/actions";
import { EditDiff } from "./EditDiff";

/** Modifications de fiche demandées par écrit : rien ne change sans l'accord de l'administrateur. */
export function AdminEdits({ live }: { live?: EditRequestView[] }) {
  if (!supabaseEnabled) return null;
  const list = live ?? [];
  return (
    <section className="card space-y-6" aria-labelledby="modifs-admin">
      <div>
        <h2 id="modifs-admin" className="text-xl font-medium text-white">Modifications de fiche demandées</h2>
        <p className="mt-2 text-sm text-ash">
          Le vendeur a écrit ce qu'il veut changer ; une proposition a été préparée. Vérifiez-la (rien de trompeur), corrigez si besoin, puis appliquez.
        </p>
      </div>
      {list.length === 0 && <p className="text-sm text-iron">Aucune demande en attente.</p>}
      <ul className="space-y-6">
        {list.map((r) => <EditItem key={r.id} r={r} />)}
      </ul>
    </section>
  );
}

const specsToText = (s: [string, string][]) => s.map(([k, v]) => `${k} : ${v}`).join("\n");
const textToSpecs = (t: string): [string, string][] =>
  t.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf(":");
    return (i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, ""]) as [string, string];
  }).filter(([k, v]) => k && v);

function EditItem({ r }: { r: EditRequestView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const p = r.proposal?.changes ?? {};
  const c = r.current;
  // Formulaire prérempli avec la proposition (ou la valeur actuelle) : l'admin a le dernier mot.
  const [f, setF] = useState({
    name: p.name ?? c.name,
    short: p.short ?? c.short ?? "",
    description: p.description ?? c.description ?? "",
    price: String(p.price ?? c.price),
    compareAt: "compareAt" in p ? (p.compareAt ? String(p.compareAt) : "") : c.compareAt ? String(c.compareAt) : "",
    specs: specsToText(p.specs ?? c.specs),
    note: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function changes(): EditChangesView {
    const out: EditChangesView = {};
    if (f.name.trim() !== c.name) out.name = f.name.trim();
    if (f.short.trim() !== (c.short ?? "")) out.short = f.short.trim();
    if (f.description.trim() !== (c.description ?? "")) out.description = f.description.trim();
    const price = Number(f.price.replace(/\D/g, ""));
    if (price && price !== c.price) out.price = price;
    const compare = f.compareAt.trim() ? Number(f.compareAt.replace(/\D/g, "")) : null;
    if (compare !== c.compareAt) out.compareAt = compare;
    const specs = textToSpecs(f.specs);
    if (JSON.stringify(specs) !== JSON.stringify(c.specs)) out.specs = specs;
    return out;
  }
  const diff = changes();

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const x = await fn();
      toast(x.ok ? msg : x.error ?? "Erreur", x.ok ? "ok" : "error");
      if (x.ok) router.refresh();
    });

  return (
    <li className="space-y-4 rounded-[6px] border border-iris/40 p-4" data-admin-edit={r.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-white">{r.shopName} · <Link href={`/produits/${r.productSlug}`} prefetch={false} className="text-iris hover:underline">{r.productName}</Link></span>
        <span className="font-mono text-xs text-iron">{r.createdAt.slice(0, 10)}</span>
      </div>
      <p className="whitespace-pre-line break-words text-sm text-bone"><span className="text-ash">Demande du vendeur :</span> « {r.message} »</p>
      {r.proposal?.note && <p className="text-sm text-ash"><span className="font-mono text-xs text-iron">{r.ai ? "note de l'IA" : "proposition sans IA"} · </span>{r.proposal.note}</p>}
      {!r.proposal && <p className="text-sm text-iron">Pas de proposition automatique : modifiez les champs à la main.</p>}

      <details className="group" open={Object.keys(p).length === 0}>
        <summary className="cursor-pointer text-sm text-ash hover:text-white">Corriger avant d'appliquer</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="label">Nom</span><input className="input" value={f.name} onChange={set("name")} maxLength={120} /></label>
          <label className="sm:col-span-2"><span className="label">Accroche</span><input className="input" value={f.short} onChange={set("short")} maxLength={200} /></label>
          <label className="sm:col-span-2"><span className="label">Description</span><textarea className="input" rows={4} value={f.description} onChange={set("description")} maxLength={5000} /></label>
          <label><span className="label">Prix (FCFA)</span><input className="input" inputMode="numeric" value={f.price} onChange={set("price")} /></label>
          <label><span className="label">Prix barré (vide = aucun)</span><input className="input" inputMode="numeric" value={f.compareAt} onChange={set("compareAt")} /></label>
          <label className="sm:col-span-2"><span className="label">Caractéristiques (une par ligne, « Nom : valeur »)</span><textarea className="input font-mono text-xs" rows={4} value={f.specs} onChange={set("specs")} /></label>
        </div>
      </details>

      <div className="space-y-2">
        <p className="text-xs text-ash">Ce qui sera appliqué :</p>
        <EditDiff changes={diff} current={c} />
      </div>
      <label className="block"><span className="label">Message au vendeur (facultatif)</span><input className="input" value={f.note} onChange={set("note")} maxLength={500} /></label>
      <div className="flex flex-wrap gap-2">
        <button className="btn-solid px-3 py-1.5 text-xs" data-haptic disabled={pending || !Object.keys(diff).length} onClick={() => act(() => adminApplyEdit({ id: r.id, changes: diff, note: f.note || undefined }), "Modification appliquée sur la fiche")}>
          Appliquer
        </button>
        <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => act(() => adminRejectEdit({ id: r.id, note: f.note || "Demande refusée" }), "Demande refusée")}>
          Refuser
        </button>
      </div>
    </li>
  );
}

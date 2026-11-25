"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addManualSale, deleteManualSale } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { LiveSeller, ManualSaleView } from "@/lib/views";
import { PhoneInput } from "./PhoneInput";

const CHANNELS: { id: ManualSaleView["channel"]; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telephone", label: "Téléphone" },
  { id: "boutique", label: "En boutique" },
  { id: "autre", label: "Autre" },
];
const today = () => new Date().toISOString().slice(0, 10);

/**
 * « Mes ventes hors site » : le vendeur note en quelques secondes une vente conclue sur WhatsApp, au téléphone
 * ou en boutique. Elle compte dans son tableau de bord, comme les commandes passées sur NEXORA.
 */
export function ManualSales({ offline }: { offline: NonNullable<LiveSeller["offline"]> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const blank = { productId: "", label: "", qty: "1", amount: "", channel: "whatsapp" as ManualSaleView["channel"], customerName: "", customerPhone: "", soldOn: today() };
  const [f, setF] = useState(blank);

  function pickProduct(id: string) {
    const p = offline.products.find((x) => x.id === id);
    setF({ ...f, productId: id, label: p?.name ?? f.label, amount: p ? String(p.price * (Number(f.qty) || 1)) : f.amount });
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await addManualSale({
        productId: f.productId || null, label: f.label, qty: Number(f.qty) || 1, amount: Number(f.amount.replace(/\D/g, "")) || 0,
        channel: f.channel, customerName: f.customerName, customerPhone: f.customerPhone, soldOn: f.soldOn,
      });
      if (!r.ok) return toast(r.error ?? "Erreur", "error");
      toast("Vente enregistrée", "ok");
      setF(blank);
      setOpen(false);
      router.refresh();
    });
  }
  const remove = (id: string) => start(async () => { const r = await deleteManualSale({ id }); if (!r.ok) return toast(r.error ?? "Erreur", "error"); toast("Vente supprimée", "ok"); router.refresh(); });

  return (
    <section className="card space-y-5" aria-labelledby="ventes-hors-site">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ventes-hors-site" className="text-xl font-medium text-white">Ventes WhatsApp, téléphone et boutique</h2>
          <p className="mt-1 text-sm text-ash">Notez ici les ventes conclues hors du site : elles comptent dans vos chiffres du mois.</p>
        </div>
        {!open && <button type="button" className="btn-solid" data-haptic onClick={() => setOpen(true)}>+ Ajouter une vente</button>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[14px] bg-lift p-3"><p className="text-xs text-ash">Demandes WhatsApp ce mois</p><p className="mt-1 font-mono text-xl text-white">{offline.leads}</p></div>
        <div className="rounded-[14px] bg-lift p-3"><p className="text-xs text-ash">Ventes notées ce mois</p><p className="mt-1 font-mono text-xl text-white">{offline.monthCount}</p></div>
        <div className="rounded-[14px] bg-lift p-3"><p className="text-xs text-ash">Montant</p><p className="mt-1 font-mono text-xl text-white">{formatPrice(offline.monthAmount)}</p></div>
      </div>

      {open && (
        <form onSubmit={submit} className="grid gap-3 rounded-[18px] border border-line p-4 sm:grid-cols-2">
          {offline.products.length > 0 && (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="ms-product">Produit vendu</label>
              <select id="ms-product" className="input" value={f.productId} onChange={(e) => pickProduct(e.target.value)}>
                <option value="">Autre (écrire ci-dessous)</option>
                {offline.products.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatPrice(p.price)}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="ms-label">Ce qui a été vendu</label>
            <input id="ms-label" required minLength={2} maxLength={120} className="input" placeholder="Ex. : 2 robes wax taille M" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ms-qty">Quantité</label>
            <input id="ms-qty" inputMode="numeric" className="input font-mono" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div>
            <label className="label" htmlFor="ms-amount">Montant total (FCFA)</label>
            <input id="ms-amount" required inputMode="numeric" className="input font-mono" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^\d ]/g, "") })} />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="label">Vendu par</legend>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <button key={c.id} type="button" aria-pressed={f.channel === c.id} onClick={() => setF({ ...f, channel: c.id })} className={`pill ${f.channel === c.id ? "border-white text-white" : "text-ash"}`}>{c.label}</button>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="ms-name">Client <span className="text-iron">(facultatif)</span></label>
            <input id="ms-name" maxLength={80} className="input" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} />
          </div>
          <PhoneInput label="Téléphone du client (facultatif)" value={f.customerPhone} onChange={(v) => setF({ ...f, customerPhone: v })} />
          <div>
            <label className="label" htmlFor="ms-date">Date</label>
            <input id="ms-date" type="date" max={today()} className="input" value={f.soldOn} onChange={(e) => setF({ ...f, soldOn: e.target.value })} />
          </div>
          <div className="flex items-end gap-2">
            <button className="btn-solid flex-1" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer la vente"}</button>
            <button type="button" className="btn" onClick={() => { setOpen(false); setF(blank); }}>Annuler</button>
          </div>
        </form>
      )}

      {offline.sales.length > 0 ? (
        <ul className="divide-y divide-line">
          {offline.sales.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="min-w-0">
                <span className="text-white">{s.qty > 1 ? `${s.qty} × ` : ""}{s.label}</span>
                <span className="block text-xs text-ash">
                  {new Date(s.soldOn).toLocaleDateString("fr-FR")} · {CHANNELS.find((c) => c.id === s.channel)?.label}{s.customer ? ` · ${s.customer}` : ""}{s.phone ? ` · ${s.phone}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-white">{formatPrice(s.amount)}</span>
                <button type="button" className="text-xs text-ash underline underline-offset-4" disabled={pending} onClick={() => remove(s.id)}>Supprimer</button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-iron">Aucune vente notée pour l&apos;instant.</p>
      )}
    </section>
  );
}

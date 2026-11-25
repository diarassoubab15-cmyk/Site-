"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addCourier, assignCourier, deleteCourier, settleCash } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { LiveSeller } from "@/lib/views";
import { PhoneInput } from "./PhoneInput";

type Order = LiveSeller["orders"][number];
type Courier = NonNullable<LiveSeller["couriers"]>[number];
const wa = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/**
 * Sous chaque commande : confirmation du client par WhatsApp, refus passés du client,
 * choix du livreur (avec son lien personnel), et argent encaissé par le livreur à récupérer.
 */
export function OrderCodActions({ order, couriers, shopName }: { order: Order; couriers: Courier[]; shopName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const cod = order.cod;
  if (!cod) return null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const courier = couriers.find((c) => c.id === cod.courierId);
  const active = order.status === "confirmée" || order.status === "expédiée";
  const askText = `Bonjour ${order.buyer}, ici ${shopName} (NEXORA). Merci pour votre commande ${order.id} : ${order.qty} × ${order.productName}, ${formatPrice(order.total)}. Touchez ce lien pour la confirmer avant l'envoi : ${origin}/c/${cod.confirmToken}`;
  const courierText = (token: string) =>
    `Livraison ${order.id} (${shopName}) : ${order.qty} × ${order.productName}. Client : ${order.buyer}, ${order.phone}. Adresse : ${order.city}. ${order.method === "cash_on_delivery" ? `À encaisser : ${formatPrice(order.total)}.` : "Déjà payé."} Après la livraison, touchez : ${origin}/l/${token}`;

  function assign(courierId: string) {
    start(async () => {
      const r = await assignCourier({ orderId: order.uuid!, courierId: courierId || null });
      if (!r.ok) return toast(r.error ?? "Erreur", "error");
      const c = couriers.find((x) => x.id === courierId);
      if (c && r.data) window.open(wa(c.phone, courierText(r.data)), "_blank", "noopener");
      toast(c ? `Commande confiée à ${c.name}` : "Livreur retiré", "ok");
      router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {cod.buyerRefusals > 0 && !cod.refused && (
        <span className="rounded-full bg-[#fdecec] px-2.5 py-1 text-alarm" title="Colis refusés par ce client sur NEXORA">⚠ a déjà refusé {cod.buyerRefusals} colis</span>
      )}
      {cod.refused && <span className="rounded-full bg-[#fdecec] px-2.5 py-1 text-alarm">Refusé par le client</span>}
      {active && (cod.buyerConfirmed
        ? <span className="rounded-full bg-[#e9f8ef] px-2.5 py-1 text-[#0f6b3f]">✓ confirmée par le client</span>
        : cod.confirmToken && <a className="btn px-3 py-1.5 text-xs" href={wa(order.phone, askText)} target="_blank" rel="noopener noreferrer">Demander la confirmation (WhatsApp)</a>)}
      {active && couriers.length > 0 && (
        <label className="flex items-center gap-1.5 text-ash">
          Livreur
          <select className="rounded-full border border-line bg-black px-2 py-1 text-xs text-white" value={cod.courierId ?? ""} disabled={pending} onChange={(e) => assign(e.target.value)}>
            <option value="">—</option>
            {couriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
      {active && courier && cod.courierToken && (
        <a className="text-iris underline underline-offset-4" href={wa(courier.phone, courierText(cod.courierToken))} target="_blank" rel="noopener noreferrer">Renvoyer au livreur</a>
      )}
      {cod.cashCollected && !cod.cashSettled && (
        <button type="button" className="btn-solid px-3 py-1.5 text-xs" disabled={pending}
          onClick={() => start(async () => { const r = await settleCash({ orderId: order.uuid! }); if (!r.ok) return toast(r.error ?? "Erreur", "error"); toast("Argent reçu noté", "ok"); router.refresh(); })}>
          {formatPrice(order.total)} reçus du livreur
        </button>
      )}
      {cod.cashSettled && <span className="text-pulse">✓ argent reçu</span>}
    </div>
  );
}

/** Mes livreurs : nom et numéro WhatsApp. Chaque commande attribuée leur est envoyée par WhatsApp avec un lien. */
export function CouriersPanel({ couriers }: { couriers: Courier[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: "", phone: "" });
  return (
    <section className="card space-y-4" aria-labelledby="livreurs">
      <div>
        <h2 id="livreurs" className="text-xl font-medium text-white">Mes livreurs</h2>
        <p className="mt-1 text-sm text-ash">Confiez une commande à un livreur : il reçoit l&apos;adresse, le repère et le montant sur WhatsApp, puis marque « livré » ou « refusé » d&apos;un toucher.</p>
      </div>
      {couriers.length > 0 && (
        <ul className="divide-y divide-line text-sm">
          {couriers.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-white">{c.name} <span className="font-mono text-xs text-ash">{c.phone}</span></span>
              <button type="button" className="text-xs text-ash underline underline-offset-4" disabled={pending}
                onClick={() => start(async () => { const r = await deleteCourier({ id: c.id }); if (!r.ok) return toast(r.error ?? "Erreur", "error"); router.refresh(); })}>Retirer</button>
            </li>
          ))}
        </ul>
      )}
      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => {
        e.preventDefault();
        start(async () => { const r = await addCourier(f); if (!r.ok) return toast(r.error ?? "Erreur", "error"); toast("Livreur ajouté", "ok"); setF({ name: "", phone: "" }); router.refresh(); });
      }}>
        <div><label className="label" htmlFor="c-name">Nom</label><input id="c-name" required minLength={2} maxLength={60} className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <PhoneInput label="WhatsApp du livreur" required value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
        <button className="btn-solid" disabled={pending}>Ajouter</button>
      </form>
    </section>
  );
}

/** Comptabilité simple du mois et alertes de stock. */
export function SellerBooks({ orders, offlineAmount, lowStock }: { orders: Order[]; offlineAmount: number; lowStock: NonNullable<LiveSeller["lowStock"]> }) {
  const month = new Date().toISOString().slice(0, 7);
  const m = orders.filter((o) => o.createdAt.slice(0, 7) === month);
  const delivered = m.filter((o) => o.status === "livrée");
  const fees = delivered.reduce((n, o) => n + (o.cod?.deliveryFee ?? 0), 0);
  const sales = delivered.reduce((n, o) => n + o.total, 0) - fees;
  const atCouriers = orders.filter((o) => o.cod?.cashCollected && !o.cod.cashSettled);
  const refused = m.filter((o) => o.cod?.refused);
  const rows: [string, string, string?][] = [
    ["Ventes livrées sur NEXORA", formatPrice(sales), `${delivered.length} commande${delivered.length > 1 ? "s" : ""}`],
    ["Frais de livraison facturés", formatPrice(fees)],
    ["Ventes WhatsApp / boutique notées", formatPrice(offlineAmount)],
    ["Argent chez les livreurs (à récupérer)", formatPrice(atCouriers.reduce((n, o) => n + o.total, 0)), `${atCouriers.length} colis`],
    ["Colis refusés", String(refused.length), refused.length ? formatPrice(refused.reduce((n, o) => n + o.total, 0)) + " non encaissés" : undefined],
  ];
  return (
    <section className="card space-y-5" aria-labelledby="compta">
      <h2 id="compta" className="text-xl font-medium text-white">Comptabilité du mois</h2>
      <dl className="divide-y divide-line text-sm">
        {rows.map(([k, v, note]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-ash">{k}{note && <span className="block text-xs text-iron">{note}</span>}</dt>
            <dd className="font-mono text-white">{v}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 py-2.5">
          <dt className="font-medium text-white">Total du mois</dt>
          <dd className="font-mono text-lg text-white">{formatPrice(sales + fees + offlineAmount)}</dd>
        </div>
      </dl>
      {lowStock.length > 0 && (
        <div className="rounded-[18px] bg-[#fff6e5] p-4 text-sm text-[#8a5a00]" role="status">
          <p className="font-medium">Stock bas : pensez à réapprovisionner</p>
          <ul className="mt-2 space-y-1">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <Link href={`/vendeur/produits/${p.id}`} className="underline underline-offset-4">{p.name}</Link>
                <span className="font-mono">{p.stock === 0 ? "épuisé (masqué)" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

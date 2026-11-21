"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearCart, removeFromCart, setCartQty, useCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { toast } from "@/lib/toast";
import { placeOrder, setPreferredPayment } from "@/app/actions";
import { SuccessCheck } from "./SuccessCheck";

const CHOICES: PaymentMethodId[] = ["orange_money", "wave", "mtn_momo", "moov_money", "card", "cash_on_delivery"];

/** Moyen de paiement préféré : présélectionné à chaque achat, si la boutique l'accepte. */
export function PaymentPreference({ initial }: { initial: PaymentMethodId | null }) {
  const router = useRouter();
  const [value, setValue] = useState<PaymentMethodId | null>(initial);
  const [pending, start] = useTransition();
  function choose(m: PaymentMethodId) {
    const prev = value;
    setValue(m);
    start(async () => {
      const r = await setPreferredPayment({ method: m });
      if (!r.ok) { setValue(prev); toast(r.error ?? "Erreur", "error"); return; }
      toast(`Paiement préféré : ${paymentMethods[m].label}`);
      router.refresh();
    });
  }
  return (
    <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3" disabled={pending}>
      <legend className="sr-only">Moyen de paiement préféré</legend>
      {CHOICES.map((m) => (
        <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-3 text-sm transition-colors ${value === m ? "border-[#3b9eff] text-white" : "border-line text-bone hover:border-iron"}`}>
          <input type="radio" name="pref-pay" checked={value === m} onChange={() => choose(m)} className="accent-[#3b9eff]" />
          {paymentMethods[m].label}
        </label>
      ))}
    </fieldset>
  );
}

/** Moyen utilisé pour un article du panier : le préféré si la boutique l'accepte, sinon la livraison, sinon le premier accepté. */
const methodFor = (item: CartItem, preferred: PaymentMethodId | null): PaymentMethodId =>
  preferred && item.payments.includes(preferred) ? preferred : item.payments.includes("cash_on_delivery") ? "cash_on_delivery" : item.payments[0] ?? "cash_on_delivery";

/** Panier : une commande par article (chaque boutique reçoit la sienne), l'adresse n'est demandée qu'une fois. */
export function CartPanel({ preferred, known }: { preferred: PaymentMethodId | null; known: { name: string; phone: string; city: string } | null }) {
  const items = useCart();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name: known?.name ?? "", phone: known?.phone ?? "", city: known?.city ?? "" });
  const [done, setDone] = useState<string[]>([]);
  const [error, setError] = useState("");
  const needsAddress = !known?.name || !known.phone || !known.city;
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);

  function checkout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const refs: string[] = [];
      const ordered: string[] = [];
      for (const [k, it] of items.entries()) {
        const r = await placeOrder({ slug: it.slug, qty: it.qty, method: methodFor(it, preferred), shipping: needsAddress && k === 0 ? form : undefined });
        if (!r.ok) { setError(`${it.name} : ${r.error}`); break; }
        refs.push(r.data ?? "");
        ordered.push(it.slug);
      }
      if (ordered.length) clearCart(ordered);
      setDone(refs);
    });
  }

  if (done.length && !items.length) {
    return (
      <div className="pop space-y-3" role="status">
        <p className="flex items-center gap-3 text-white"><SuccessCheck size={22} />{done.length} commande{done.length > 1 ? "s" : ""} envoyée{done.length > 1 ? "s" : ""}</p>
        <p className="font-mono text-sm text-iris">{done.join(" · ")}</p>
        <p className="text-sm text-ash">Chaque boutique a reçu sa commande. Suivez-les dans l&apos;historique ci-dessous.</p>
      </div>
    );
  }
  if (!items.length) {
    return <p className="text-sm text-ash">Votre panier est vide. <Link href="/categories" className="link">Parcourir les boutiques</Link></p>;
  }

  return (
    <form onSubmit={checkout} className="space-y-5">
      <ul className="divide-y divide-line rounded-[14px] border border-line" data-cart>
        {items.map((it) => (
          <li key={it.slug} className="flex flex-wrap items-center gap-3 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {it.image ? <img src={it.image} alt="" className="h-12 w-12 rounded-[8px] object-cover" /> : <span className="h-12 w-12 rounded-[8px] bg-lift" aria-hidden="true" />}
            <span className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-auto">
              <Link href={`/produits/${it.slug}`} className="block truncate text-white hover:underline">{it.name}</Link>
              <span className="block truncate text-xs text-ash">{it.shopName} · {paymentMethods[methodFor(it, preferred)].label}</span>
            </span>
            <span className="flex items-center gap-1">
              <button type="button" className="btn px-2.5 py-1" aria-label={`Retirer un ${it.name}`} onClick={() => setCartQty(it.slug, it.qty - 1)}>−</button>
              <span className="w-8 text-center font-mono text-sm text-white" aria-live="polite">{it.qty}</span>
              <button type="button" className="btn px-2.5 py-1" aria-label={`Ajouter un ${it.name}`} onClick={() => setCartQty(it.slug, it.qty + 1)}>+</button>
            </span>
            <span className="ml-auto w-28 text-right font-mono text-sm text-white">{formatPrice(it.price * it.qty)}</span>
            <button type="button" className="text-xs text-alarm hover:underline" onClick={() => removeFromCart(it.slug)}>Retirer</button>
          </li>
        ))}
      </ul>
      {needsAddress && (
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="label">Livraison (demandée une seule fois)</legend>
          <input aria-label="Nom" required className="input" placeholder="Nom" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input aria-label="Téléphone" required className="input" placeholder="Téléphone" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input aria-label="Ville et quartier" required className="input" placeholder="Ville, quartier" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </fieldset>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <p className="text-sm text-ash">Total indicatif <span className="ml-2 font-mono text-lg text-white">{formatPrice(total)}</span></p>
        <button className="btn-solid" data-haptic disabled={pending}>{pending ? "Envoi…" : `Commander (${items.length})`}</button>
      </div>
      {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
      <p className="text-xs text-iron">Chaque article devient une commande auprès de sa boutique ; le prix final (prix de gros compris) est recalculé à la commande.</p>
    </form>
  );
}

/** Pastille du panier dans l'en-tête. */
export function CartBadge() {
  const items = useCart();
  const n = items.reduce((s, i) => s + i.qty, 0);
  return (
    <Link href="/reglages#panier" className="relative flex h-9 w-9 items-center justify-center rounded-[8px] text-bone hover:text-white" aria-label={`Panier : ${n} article${n > 1 ? "s" : ""}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9.5" cy="19.5" r="1.3" fill="currentColor" /><circle cx="17" cy="19.5" r="1.3" fill="currentColor" /></svg>
      {n > 0 && <span className="pop absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3b9eff] px-1 font-mono text-[10px] text-black">{n}</span>}
    </Link>
  );
}

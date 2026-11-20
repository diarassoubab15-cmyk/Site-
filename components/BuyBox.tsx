"use client";
import Link from "next/link";
import { useState } from "react";
import type { Product, Shop } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { today, uid, update, useDemo } from "@/lib/demo-store";

export function BuyBox({ product, shop }: { product: Product; shop: Shop }) {
  const demo = useDemo();
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<PaymentMethodId>(shop.acceptsCashOnDelivery ? "cash_on_delivery" : shop.payments[0]);
  const [form, setForm] = useState({ name: "", phone: "", city: "" });
  const [done, setDone] = useState<string | null>(null);

  const wholesale = product.wholesale && qty >= product.wholesale.minQty;
  const unit = wholesale ? product.wholesale!.price : product.price;
  const total = unit * qty;
  const out = product.stock === 0;
  // On ne redemande jamais une information déjà connue : le profil est réutilisé.
  const needsProfile = !demo.profile;

  function order(e: React.FormEvent) {
    e.preventDefault();
    const id = uid("NX");
    update((s) => ({
      ...s,
      profile: s.profile ?? { name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), email: "", country: "" },
      orders: [
        { id, product: product.slug, productName: product.name, shop: shop.name, qty, total, method, status: "confirmée", createdAt: today() },
        ...s.orders,
      ],
    }));
    setDone(id);
  }

  if (done) {
    return (
      <div className="card space-y-4" role="status">
        <p className="eyebrow text-pulse">Commande envoyée</p>
        <p className="text-white">Commande <span className="font-mono text-iris">{done}</span> transmise à {shop.name}.</p>
        <p className="text-sm text-ash">
          {method === "cash_on_delivery"
            ? "Vous paierez en main propre au livreur, à la réception du colis."
            : `Vous allez payer avec ${paymentMethods[method].label}. L'argent est versé directement au vendeur.`}{" "}
          Si le colis n&apos;arrive pas, signalez-le depuis votre compte : vous serez remboursé ou le vendeur sera sanctionné.
        </p>
        <Link href="/compte" className="btn">Suivre ma commande</Link>
      </div>
    );
  }

  return (
    <form onSubmit={order} className="card space-y-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-2xl text-white">{formatPrice(unit)}</span>
        {product.compareAt && !wholesale && <s className="font-mono text-sm text-iron">{formatPrice(product.compareAt)}</s>}
        {wholesale && <span className="badge text-pulse">prix de gros appliqué</span>}
      </div>
      {product.wholesale && (
        <p className="text-sm text-ash">
          Prix de gros : <span className="font-mono text-bone">{formatPrice(product.wholesale.price)}</span> à partir de {product.wholesale.minQty} unités.
        </p>
      )}

      <div>
        <label htmlFor="qty" className="label">Quantité</label>
        <input id="qty" type="number" min={1} max={Math.max(product.stock, 1)} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(product.stock || 1, Number(e.target.value) || 1)))} className="input w-28 font-mono" disabled={out} />
        <p className="mt-1.5 text-xs text-iron">{out ? "Rupture de stock" : `${product.stock} en stock`}</p>
      </div>

      <fieldset>
        <legend className="label">Paiement</legend>
        <div className="grid gap-2">
          {shop.payments.map((m) => (
            <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-2.5 text-sm transition-colors ${method === m ? "border-white text-white" : "border-line text-bone hover:border-iron"}`}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-[#9281f7]" />
              <span className="h-2 w-2 rounded-full" style={{ background: paymentMethods[m].color }} aria-hidden="true" />
              {paymentMethods[m].label}
              {m === "cash_on_delivery" && <span className="ml-auto text-xs text-pulse">payer à la réception</span>}
            </label>
          ))}
        </div>
        {!shop.acceptsCashOnDelivery && <p className="mt-2 text-xs text-iron">Ce vendeur ne propose pas le paiement à la livraison.</p>}
      </fieldset>

      {needsProfile && !out && (
        <fieldset className="space-y-3">
          <legend className="label">Livraison <span className="font-normal text-iron">(demandé une seule fois)</span></legend>
          <input required placeholder="Nom complet" autoComplete="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Téléphone" autoComplete="tel" inputMode="tel" pattern="[+0-9 ]{8,}" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input required placeholder="Ville et quartier" autoComplete="address-level2" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </fieldset>
      )}
      {!needsProfile && (
        <p className="text-sm text-ash">Livraison à <span className="text-bone">{demo.profile!.name}</span>, {demo.profile!.city} · <Link href="/compte#profil" className="link">modifier</Link></p>
      )}

      <div className="flex items-center justify-between border-t border-line pt-5">
        <span className="text-sm text-ash">Total</span>
        <span className="font-mono text-lg text-white">{formatPrice(total)}</span>
      </div>
      <button type="submit" className="btn-solid w-full" disabled={out}>
        {out ? "Indisponible" : method === "cash_on_delivery" ? "Commander, payer à la livraison" : `Payer avec ${paymentMethods[method].label}`}
      </button>
      <p className="text-xs leading-relaxed text-iron">
        Paiement versé directement à {shop.name}. Protection acheteur : produit non reçu = remboursement ou sanction du vendeur.
      </p>
    </form>
  );
}

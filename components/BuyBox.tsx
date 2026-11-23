"use client";
import { PhoneInput } from "./PhoneInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { addToCart } from "@/lib/cart";
import { toast } from "@/lib/toast";
import type { Product, Shop } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { today, uid, update, useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { useBuyerContext } from "@/lib/use-buyer-context";
import { cardPaymentStatus, placeOrder } from "@/app/actions";
import { OrderPayment } from "./OrderPayment";
import { SuccessCheck } from "./SuccessCheck";

type Known = { name: string; city: string } | null;

export function BuyBox({ product, shop }: { product: Product; shop: Shop }) {
  const demo = useDemo();
  const live = useBuyerContext(product.slug);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<PaymentMethodId>(shop.acceptsCashOnDelivery ? "cash_on_delivery" : shop.payments[0]);
  const [form, setForm] = useState({ name: "", phone: "", city: "" });
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Carte : proposée comme disponible seulement quand le prestataire de paiement est branché.
  const [cardReady, setCardReady] = useState(!supabaseEnabled);
  useEffect(() => { if (supabaseEnabled) cardPaymentStatus().then(setCardReady).catch(() => setCardReady(false)); }, []);
  // Moyen de paiement préféré (Réglages) : présélectionné s'il est accepté par cette boutique.
  const preferred = live.preferredPayment as PaymentMethodId | null | undefined;
  useEffect(() => {
    if (preferred && shop.payments.includes(preferred)) setMethod(preferred);
  }, [preferred, shop.payments]);

  const wholesale = product.wholesale && qty >= product.wholesale.minQty;
  const unit = wholesale ? product.wholesale!.price : product.price;
  const total = unit * qty;
  const out = product.stock === 0;
  // On ne redemande jamais une information déjà connue : le profil est réutilisé.
  const known: Known = supabaseEnabled ? live.known : demo.profile ? { name: demo.profile.name, city: demo.profile.city } : null;
  const needsProfile = !known;

  function order(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supabaseEnabled) {
      const id = uid("NX");
      update((s) => ({
        ...s,
        profile: s.profile ?? { name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), email: "", country: "" },
        orders: [{ id, product: product.slug, productName: product.name, shop: shop.name, qty, total, method, status: "confirmée", createdAt: today() }, ...s.orders],
      }));
      return setDone(id);
    }
    if (!live.loggedIn) return router.push(`/connexion?next=${encodeURIComponent(`/produits/${product.slug}`)}`);
    start(async () => {
      const res = await placeOrder({ slug: product.slug, qty, method, shipping: needsProfile ? form : undefined });
      if (res.ok) setDone(res.data ?? "");
      else if (res.login) router.push(`/connexion?next=${encodeURIComponent(`/produits/${product.slug}`)}`);
      else setError(res.error);
    });
  }

  if (done) {
    return (
      <div className="card pop space-y-4" role="status">
        <p className="eyebrow flex items-center gap-3 text-pulse"><SuccessCheck />Commande envoyée</p>
        <p className="text-white">Commande <span className="font-mono text-iris">{done}</span> transmise à {shop.name}.</p>
        {method === "cash_on_delivery"
          ? <p className="text-sm text-ash">Vous paierez en main propre au livreur, à la réception du colis.</p>
          : supabaseEnabled
            ? <OrderPayment orderRef={done} method={method} total={total} />
            : <p className="text-sm text-ash">Paiement {paymentMethods[method].label} : en version réelle, le numéro du vendeur (ou la page de paiement par carte) s&apos;affiche ici.</p>}
        <p className="text-sm text-ash">Si le colis n&apos;arrive pas, signalez-le depuis votre compte : vous serez remboursé ou le vendeur sera sanctionné.</p>
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
          {shop.payments.map((m) => {
            const off = m === "card" && !cardReady;
            return (
              <label key={m} className={`flex items-center gap-3 rounded-[14px] border px-3 py-2.5 text-sm transition-colors ${off ? "cursor-not-allowed border-line text-iron" : method === m ? "cursor-pointer border-white text-white" : "cursor-pointer border-line text-bone hover:border-iron"}`}>
                <input type="radio" name="method" value={m} checked={method === m} disabled={off} onChange={() => setMethod(m)} className="accent-[#5433eb]" />
                <span className="h-2 w-2 rounded-full" style={{ background: paymentMethods[m].color }} aria-hidden="true" />
                {m === "card" ? "Carte Visa / Mastercard" : paymentMethods[m].label}
                {m === "cash_on_delivery" && <span className="ml-auto text-xs text-pulse">payer à la réception</span>}
                {m === "card" && <span className="ml-auto text-xs text-iron">{off ? "bientôt" : "tous les pays"}</span>}
                {(m === "orange_money" || m === "wave") && <span className="ml-auto text-xs text-iron">direct au vendeur</span>}
              </label>
            );
          })}
        </div>
        {!shop.acceptsCashOnDelivery && <p className="mt-2 text-xs text-iron">Ce vendeur ne propose pas le paiement à la livraison.</p>}
      </fieldset>

      {live.loaded && needsProfile && !out && (!supabaseEnabled || live.loggedIn) && (
        <fieldset className="space-y-3">
          <legend className="label">Livraison <span className="font-normal text-iron">(demandé une seule fois)</span></legend>
          <input required placeholder="Nom complet" autoComplete="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <PhoneInput required placeholder="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <input required placeholder="Ville et quartier" autoComplete="address-level2" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </fieldset>
      )}
      {known && (
        <p className="text-sm text-ash">Livraison à <span className="text-bone">{known.name}</span>, {known.city} · <Link href="/compte#profil" className="link">modifier</Link></p>
      )}
      {supabaseEnabled && live.loaded && !live.loggedIn && !out && (
        <p className="text-sm text-ash">Connectez-vous (ou créez votre compte en 1 minute) pour commander.</p>
      )}

      <div className="flex items-center justify-between border-t border-line pt-5">
        <span className="text-sm text-ash">Total</span>
        <span className="font-mono text-lg text-white">{formatPrice(total)}</span>
      </div>
      {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
      <button type="submit" data-haptic className="btn-solid w-full" disabled={out || pending || !live.loaded}>
        {out
          ? "Indisponible"
          : pending
            ? "Envoi…"
            : supabaseEnabled && live.loaded && !live.loggedIn
              ? "Se connecter pour commander"
              : method === "cash_on_delivery"
                ? "Commander, payer à la livraison"
                : `Payer avec ${paymentMethods[method].label}`}
      </button>
      {!out && (
        <button
          type="button"
          className="btn w-full"
          data-haptic
          onClick={() => {
            addToCart({ slug: product.slug, name: product.name, price: product.price, shopName: shop.name, payments: shop.payments, image: product.images?.[0] }, qty);
            toast(`Ajouté au panier (${qty})`);
          }}
        >
          Ajouter au panier
        </button>
      )}
      <p className="text-xs leading-relaxed text-iron">
        Paiement versé directement à {shop.name}. Protection acheteur : produit non reçu = remboursement ou sanction du vendeur.
      </p>
    </form>
  );
}

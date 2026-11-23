"use client";
import { useEffect, useState, useTransition } from "react";
import { getOrderPayInfo, payOrderByCard, type OrderPayInfo } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { toast } from "@/lib/toast";

/**
 * Ce que l'acheteur fait juste après sa commande :
 *  - Orange Money / Wave / MTN / Moov : le numéro du vendeur, le montant exact, 3 étapes, bouton Copier ;
 *  - Carte : un seul bouton vers la page sécurisée du prestataire (la carte n'est jamais saisie sur NEXORA).
 */
export function OrderPayment({ orderRef, method, total }: { orderRef: string; method: PaymentMethodId; total: number }) {
  const [info, setInfo] = useState<OrderPayInfo | null | undefined>(undefined);
  const [pending, start] = useTransition();
  useEffect(() => { if (method !== "cash_on_delivery" && method !== "card") getOrderPayInfo(orderRef).then(setInfo).catch(() => setInfo(null)); }, [orderRef, method]);

  if (method === "cash_on_delivery") return null;
  if (method === "card") {
    return (
      <div className="space-y-3 rounded-[18px] bg-lift p-4">
        <p className="text-sm text-bone">Payez <strong className="font-mono text-white">{formatPrice(total)}</strong> avec votre carte Visa ou Mastercard, sur la page sécurisée de PayDunya, notre partenaire de paiement agréé. Aucun compte à créer.</p>
        <button type="button" className="btn-solid w-full" data-haptic disabled={pending}
          onClick={() => start(async () => { const r = await payOrderByCard(orderRef); if (r.ok && r.data) window.location.assign(r.data); else toast(r.ok ? "Erreur" : r.error, "error"); })}>
          {pending ? "Ouverture du paiement…" : `Payer ${formatPrice(total)} par carte`}
        </button>
        <p className="flex items-center justify-center gap-2 text-xs text-iron"><span aria-hidden="true">🔒</span> Paiement chiffré · vos numéros de carte ne passent jamais par NEXORA</p>
      </div>
    );
  }

  const label = paymentMethods[method].label;
  if (info === undefined) return <p className="text-sm text-iron">Préparation du paiement…</p>;
  const amount = info?.total ?? total;
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); toast(`${what} copié`, "ok"); } catch { toast("Copie impossible : notez-le à la main.", "error"); } };

  if (!info?.payNumber) {
    const wa = info?.whatsapp?.replace(/[^\d]/g, "");
    return (
      <div className="space-y-2 rounded-[18px] bg-lift p-4 text-sm text-bone">
        <p>Le vendeur vous envoie son numéro {label} pour le paiement de <strong className="font-mono text-white">{formatPrice(amount)}</strong>.</p>
        {wa && <a className="btn w-full" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour, je viens de commander (réf. ${orderRef}). Quel est votre numéro ${label} pour payer ${formatPrice(amount)} ?`)}`} target="_blank" rel="noopener noreferrer">Demander sur WhatsApp</a>}
      </div>
    );
  }
  const steps = method === "wave"
    ? ["Ouvrez l'application Wave", "Touchez « Envoyer » et entrez le numéro ci-dessous", `Envoyez ${formatPrice(amount)}`]
    : method === "orange_money"
      ? ["Composez #144# (ou ouvrez l'application Orange Money / Max it)", "Choisissez « Transfert d'argent » et entrez le numéro ci-dessous", `Envoyez ${formatPrice(amount)} et validez avec votre code secret`]
      : [`Ouvrez ${label}`, "Choisissez le transfert et entrez le numéro ci-dessous", `Envoyez ${formatPrice(amount)}`];
  return (
    <div className="space-y-4 rounded-[18px] bg-lift p-4">
      <p className="text-sm text-bone">Payez <strong>{info.shopName}</strong> directement par {label} :</p>
      <ol className="space-y-1.5 text-sm text-bone">
        {steps.map((s, i) => <li key={i} className="flex gap-2"><span className="font-mono text-iris">{i + 1}.</span>{s}</li>)}
      </ol>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" className="link-pill justify-between" onClick={() => copy(info.payNumber!, "Numéro")}>
          <span className="font-mono text-white">{info.payNumber}</span><span className="text-xs text-iris">Copier</span>
        </button>
        <button type="button" className="link-pill justify-between" onClick={() => copy(String(amount), "Montant")}>
          <span className="font-mono text-white">{formatPrice(amount)}</span><span className="text-xs text-iris">Copier</span>
        </button>
      </div>
      <p className="text-xs text-iron">Indiquez la référence <span className="font-mono text-bone">{orderRef}</span> en message si possible. Le vendeur confirme dès qu&apos;il reçoit l&apos;argent.</p>
    </div>
  );
}

"use client";
import { useState, useTransition } from "react";
import { confirmOrderByToken, courierReport } from "@/app/actions";

/** Bouton « Je confirme ma commande » (lien reçu par le client sur WhatsApp). */
export function ConfirmOrderButton({ token }: { token: string }) {
  const [done, setDone] = useState<boolean | null>(null);
  const [pending, start] = useTransition();
  if (done) return <p className="rounded-[18px] bg-[#e9f8ef] px-4 py-3 text-center text-[#0f6b3f]" role="status">Merci ! Votre commande est confirmée. Le vendeur prépare l&apos;envoi.</p>;
  return (
    <div className="space-y-2">
      <button type="button" className="btn-solid w-full py-3 text-base" data-haptic disabled={pending} onClick={() => start(async () => setDone(await confirmOrderByToken(token)))}>
        {pending ? "Un instant…" : "Je confirme ma commande"}
      </button>
      {done === false && <p className="text-center text-sm text-alarm" role="alert">Cette commande ne peut plus être confirmée (déjà livrée ou annulée).</p>}
    </div>
  );
}

/** Boutons du livreur : livré (argent encaissé) ou refusé par le client. */
export function CourierButtons({ token, cod, amount }: { token: string; cod: boolean; amount: string }) {
  const [done, setDone] = useState<"delivered" | "refused" | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const send = (o: "delivered" | "refused") => start(async () => { const ok = await courierReport(token, o); if (ok) setDone(o); else setError(true); });
  if (done) return <p className="rounded-[18px] bg-lift px-4 py-3 text-center text-white" role="status">{done === "delivered" ? "Livraison enregistrée. Merci !" : "Refus enregistré : le vendeur est prévenu."}</p>;
  return (
    <div className="space-y-2">
      <button type="button" className="btn-solid w-full py-3 text-base" data-haptic disabled={pending} onClick={() => confirm(cod ? `Colis remis et ${amount} encaissés ?` : "Colis remis au client ?") && send("delivered")}>
        {cod ? `Livré · ${amount} encaissés` : "Livré"}
      </button>
      <button type="button" className="btn-danger w-full py-3" disabled={pending} onClick={() => confirm("Le client refuse le colis ?") && send("refused")}>Refusé par le client</button>
      {error && <p className="text-center text-sm text-alarm" role="alert">Cette livraison est déjà enregistrée ou n&apos;est plus en cours.</p>}
    </div>
  );
}

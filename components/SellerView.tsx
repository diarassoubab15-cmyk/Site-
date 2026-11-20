"use client";
import Link from "next/link";
import { useState } from "react";
import { NotificationPrefs } from "./NotificationPrefs";
import { plans } from "@/lib/plans";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { uid, update, useDemo } from "@/lib/demo-store";

const statusText: Record<string, [string, string]> = {
  "en attente": ["bg-amber", "En attente d'autorisation par l'administrateur"],
  autorisé: ["bg-pulse", "Boutique autorisée et visible"],
  suspendu: ["bg-alarm", "Boutique suspendue par l'administrateur. Contactez le SAV."],
  refusé: ["bg-alarm", "Demande refusée. Aucun prélèvement n'a été effectué."],
  fermé: ["bg-iron", "Boutique fermée"],
};

export function SellerView() {
  const demo = useDemo();
  const shop = demo.sellers.find((s) => s.id === demo.myShopId);
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);
  const [opts, setOpts] = useState({ payouts: true, subscription: true, catalogue: false });
  const [confirmName, setConfirmName] = useState("");

  if (!shop) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-white">Vous n&apos;avez pas encore de boutique.</p>
        <Link href="/vendre" className="btn-solid">Demander l&apos;ouverture</Link>
      </div>
    );
  }

  const [dot, label] = statusText[shop.status];
  const plan = plans.find((p) => p.id === demo.subscription?.plan);
  const closed = shop.status === "fermé";

  function closeShop(e: React.FormEvent) {
    e.preventDefault();
    update((s) => ({
      ...s,
      sellers: s.sellers.map((x) => (x.id === shop!.id ? { ...x, status: "fermé" } : x)),
      payouts: opts.payouts ? [] : s.payouts,
      subscription: opts.subscription ? null : s.subscription,
    }));
    setClosing(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-8">
        <section className="card">
          <p className="font-mono text-xs text-iron">{shop.id}</p>
          <h2 className="mt-2 text-2xl font-medium text-white">{shop.shopName}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-bone"><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</p>
          {shop.status === "en attente" && <p className="mt-4 text-xs text-iron">Démo : ouvrez <Link href="/admin" className="link">/admin</Link> pour autoriser cette boutique.</p>}
          {plan && !closed && (
            <p className="mt-6 text-sm text-ash">Forfait <span className="text-white">{plan.name}</span> · <span className="font-mono">{formatPrice(plan.monthly)}</span>/mois · {shop.status === "autorisé" ? "actif" : "démarre après autorisation"}</p>
          )}
        </section>

        <section className="card" aria-labelledby="enc">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="enc" className="text-xl font-medium text-white">Comptes d&apos;encaissement</h2>
            {!closed && <button className="text-sm text-ash hover:text-white" onClick={() => setAdding(!adding)}>{adding ? "Annuler" : "+ Ajouter"}</button>}
          </div>
          <p className="mb-6 text-sm text-ash">L&apos;argent de vos clients arrive directement sur ces comptes. NEXORA n&apos;y a pas accès et ne conserve que les 4 derniers chiffres.</p>
          {adding && (
            <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const t = String(f.get("type")) as PaymentMethodId | "bank"; const n = String(f.get("number")).replace(/\s/g, ""); update((s) => ({ ...s, payouts: [...s.payouts, { id: uid("P"), type: t, label: t === "bank" ? "Compte bancaire" : paymentMethods[t].label, masked: `•••• ${n.slice(-4)}` }] })); setAdding(false); }}>
              <select name="type" className="input">
                {(["orange_money", "wave", "mtn_momo", "moov_money", "card", "bank"] as const).map((m) => <option key={m} value={m}>{m === "bank" ? "Compte bancaire" : paymentMethods[m].label}</option>)}
              </select>
              <input name="number" required minLength={6} placeholder="Numéro / IBAN" className="input font-mono" />
              <button className="btn">Ajouter</button>
            </form>
          )}
          {demo.payouts.length === 0 ? <p className="text-sm text-iron">Aucun compte enregistré.</p> : (
            <ul className="space-y-2">
              {demo.payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-[6px] border border-line px-4 py-3 text-sm">
                  <span className="text-white">{p.label} <span className="ml-2 font-mono text-ash">{p.masked}</span></span>
                  <button className="text-xs text-alarm hover:underline" onClick={() => update((s) => ({ ...s, payouts: s.payouts.filter((x) => x.id !== p.id) }))}>Retirer</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!closed && (
          <section className="rounded-[16px] border border-alarm/30 p-6 sm:p-8" aria-labelledby="fermer">
            <h2 id="fermer" className="text-xl font-medium text-white">Fermer ma boutique</h2>
            <p className="mt-2 text-sm text-ash">Sans frais ni justification. Vous choisissez ce qui est supprimé.</p>
            {!closing ? (
              <button className="btn-danger mt-6" onClick={() => setClosing(true)}>Fermer la boutique…</button>
            ) : (
              <form onSubmit={closeShop} className="mt-6 space-y-4">
                {([
                  ["payouts", "Supprimer toutes mes cartes et comptes de paiement associés (Mobile Money, banque)"],
                  ["subscription", "Annuler mon abonnement : aucun prélèvement futur"],
                  ["catalogue", "Supprimer aussi mes produits (les avis clients sont anonymisés)"],
                ] as const).map(([k, l]) => (
                  <label key={k} className="flex items-start gap-3 text-sm text-bone">
                    <input type="checkbox" className="mt-1 accent-[#ff9592]" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} />{l}
                  </label>
                ))}
                <div>
                  <label htmlFor="confirm" className="label">Tapez <span className="font-mono text-alarm">{shop.shopName}</span> pour confirmer</label>
                  <input id="confirm" className="input" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoComplete="off" />
                </div>
                <div className="flex gap-2">
                  <button className="btn-danger" disabled={confirmName.trim() !== shop.shopName}>Fermer définitivement</button>
                  <button type="button" className="btn" onClick={() => setClosing(false)}>Annuler</button>
                </div>
              </form>
            )}
          </section>
        )}
        {closed && (
          <p className="card text-sm text-ash">Boutique fermée. {demo.payouts.length === 0 ? "Aucun moyen de paiement n'est plus associé à votre compte." : `${demo.payouts.length} compte(s) toujours enregistré(s) : vous pouvez les retirer ci-dessus.`}</p>
        )}
      </div>
      <section className="card self-start" aria-labelledby="nv">
        <h2 id="nv" className="mb-4 text-xl font-medium text-white">Notifications vendeur</h2>
        <NotificationPrefs role="vendeur" />
      </section>
    </div>
  );
}

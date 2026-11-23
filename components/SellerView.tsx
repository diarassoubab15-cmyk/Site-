"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { NotificationPrefs } from "./NotificationPrefs";
import { SubscriptionPanel } from "./SubscriptionPanel";
import { SellerStats } from "./SellerStats";
import { SellerVideos } from "./SellerVideos";
import { allPlans } from "@/lib/plans";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { uid, update, useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { toast } from "@/lib/toast";
import type { LiveSeller } from "@/lib/views";
import { addPayout, closeShop as closeShopAction, removePayout, sellerUpdateOrder } from "@/app/actions";

const statusText: Record<string, [string, string]> = {
  "en attente": ["bg-amber", "En attente d'autorisation par l'administrateur"],
  autorisé: ["bg-pulse", "Boutique autorisée et visible"],
  suspendu: ["bg-alarm", "Boutique suspendue par l'administrateur. Contactez le SAV."],
  refusé: ["bg-alarm", "Demande refusée. Aucun prélèvement n'a été effectué."],
  fermé: ["bg-iron", "Boutique fermée"],
};

const payoutLabel = (t: string) => (t === "bank" ? "Compte bancaire" : paymentMethods[t as PaymentMethodId].label);

export function SellerView({ live }: { live?: LiveSeller | null }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);
  const [opts, setOpts] = useState({ payouts: true, subscription: true, catalogue: false });
  const [confirmName, setConfirmName] = useState("");

  const demoShop = demo.sellers.find((s) => s.id === demo.myShopId);
  const shop = supabaseEnabled ? live?.shop ?? null : demoShop ? { id: demoShop.id, shopName: demoShop.shopName, status: demoShop.status, plan: demo.subscription?.plan ?? null } : null;
  const payouts = supabaseEnabled ? live?.payouts ?? [] : demo.payouts;
  const orders = supabaseEnabled ? live?.orders ?? [] : [];

  if (!shop) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-white">Vous n&apos;avez pas encore de boutique.</p>
        <Link href="/vendre" className="btn-solid">Demander l&apos;ouverture</Link>
      </div>
    );
  }

  const [dot, label] = statusText[shop.status];
  const plan = allPlans.find((p) => p.id === shop.plan);
  const closed = shop.status === "fermé";

  function run(real: () => Promise<{ ok: boolean; error?: string }>, fake: () => void, after?: () => void, success = "Enregistré") {
    setError("");
    if (!supabaseEnabled) {
      fake();
      toast(success);
      return after?.();
    }
    start(async () => {
      const r = await real();
      if (!r.ok) {
        toast(r.error ?? "Erreur", "error");
        return setError(r.error ?? "Erreur");
      }
      toast(success);
      after?.();
      router.refresh();
    });
  }

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const type = String(f.get("type")) as PaymentMethodId | "bank";
    const number = String(f.get("number")).replace(/\s/g, "");
    run(
      () => addPayout({ type, number }),
      () => update((s) => ({ ...s, payouts: [...s.payouts, { id: uid("P"), type, label: payoutLabel(type), masked: `•••• ${number.slice(-4)}` }] })),
      () => setAdding(false),
      "Compte d'encaissement ajouté",
    );
  }

  function closeShop(e: React.FormEvent) {
    e.preventDefault();
    run(
      () => closeShopAction({ shopId: shop!.id, ...opts }),
      () =>
        update((s) => ({
          ...s,
          sellers: s.sellers.map((x) => (x.id === shop!.id ? { ...x, status: "fermé" } : x)),
          payouts: opts.payouts ? [] : s.payouts,
          subscription: opts.subscription ? null : s.subscription,
        })),
      () => setClosing(false),
      "Boutique fermée",
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-8">
        {error && <p className="rounded-[6px] border border-alarm/40 px-4 py-3 text-sm text-alarm" role="alert">{error}</p>}
        <section className="card">
          <p className="font-mono text-xs text-iron">{shop.id.slice(0, 8)}</p>
          <h2 className="mt-2 text-2xl font-medium text-white">{shop.shopName}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-bone"><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</p>
          {!supabaseEnabled && shop.status === "en attente" && <p className="mt-4 text-xs text-iron">Démo : ouvrez <Link href="/admin" className="link">/admin</Link> pour autoriser cette boutique.</p>}
          {plan && !closed && <p className="mt-6 text-sm text-ash">Forfait choisi : <span className="text-white">{plan.name}</span></p>}
        </section>

        {!closed && <SellerStats shop={shop} live={live} />}

        {!closed && shop.status === "autorisé" && (
          <Link href="/vendeur/produits" className="lift card flex items-center justify-between gap-4 hover:border-iron">
            <span>
              <span className="block text-xl font-medium text-white">Mes produits</span>
              <span className="mt-1 block text-sm text-ash">Ajouter, modifier, envoyer des photos et des visites 360°.</span>
            </span>
            <span className="text-iron" aria-hidden="true">›</span>
          </Link>
        )}

        {!closed && <SubscriptionPanel shop={shop} live={live} />}

        {!closed && shop.status === "autorisé" && <SellerVideos live={live} online={(!!live?.coveredUntil && new Date(live.coveredUntil).getTime() > Date.now() + 60_000) || (!!live?.subscription?.active && !live.subscription.until)} />}

        {supabaseEnabled && shop.status === "autorisé" && (
          <section className="card" aria-labelledby="cmdv">
            <h2 id="cmdv" className="mb-6 text-xl font-medium text-white">Commandes reçues</h2>
            {orders.length === 0 && <p className="text-sm text-ash">Aucune commande pour le moment.</p>}
            <ul className="divide-y divide-line" data-reveal suppressHydrationWarning>
              {orders.map((o) => (
                <li key={o.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-white">{o.productName} <span className="text-ash">× {o.qty}</span> · <span className="font-mono">{formatPrice(o.total)}</span></p>
                    <p className="mt-1 font-mono text-xs text-ash">{o.id} · {paymentMethods[o.method].label} · {o.status}</p>
                    <p className="mt-1 text-xs text-iron">{o.buyer} · {o.city} · {o.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {o.status === "confirmée" && (
                      <>
                        <button className="btn px-3 py-1.5 text-xs" disabled={pending} onClick={() => run(() => sellerUpdateOrder({ id: o.uuid, status: "shipped" }), () => {})}>Marquer expédiée</button>
                        <button className="btn px-3 py-1.5 text-xs" disabled={pending} onClick={() => run(() => sellerUpdateOrder({ id: o.uuid, status: "cancelled" }), () => {})}>Annuler</button>
                      </>
                    )}
                    {["expédiée", "livrée", "non reçue"].includes(o.status) && (
                      <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => confirm("Confirmez-vous avoir remboursé ce client ?") && run(() => sellerUpdateOrder({ id: o.uuid, status: "refunded" }), () => {})}>J&apos;ai remboursé</button>
                    )}
                    {o.status === "non reçue" && <span className="text-xs text-alarm">Litige : 72 h pour rembourser ou prouver la livraison</span>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card" aria-labelledby="enc">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="enc" className="text-xl font-medium text-white">Comptes d&apos;encaissement</h2>
            {!closed && <button className="text-sm text-ash hover:text-white" onClick={() => setAdding(!adding)}>{adding ? "Annuler" : "+ Ajouter"}</button>}
          </div>
          <p className="mb-6 text-sm text-ash">L&apos;argent de vos clients arrive directement sur ces comptes. NEXORA n&apos;y a pas accès et ne conserve que les 4 derniers chiffres.</p>
          {adding && (
            <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]" onSubmit={add}>
              <select name="type" className="input" aria-label="Type de compte">
                {(["orange_money", "wave", "mtn_momo", "moov_money", "card", "bank"] as const).map((m) => <option key={m} value={m}>{payoutLabel(m)}</option>)}
              </select>
              <input name="number" required minLength={6} placeholder="Numéro / IBAN" aria-label="Numéro ou IBAN" className="input font-mono" />
              <button className="btn" disabled={pending}>Ajouter</button>
            </form>
          )}
          {payouts.length === 0 ? <p className="text-sm text-iron">Aucun compte enregistré.</p> : (
            <ul className="space-y-2">
              {payouts.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-[6px] border border-line px-4 py-3 text-sm">
                  <span className="text-white">{p.label} <span className="ml-2 font-mono text-ash">{p.masked}</span></span>
                  <button className="text-xs text-alarm hover:underline" disabled={pending} onClick={() => run(() => removePayout({ id: p.id }), () => update((s) => ({ ...s, payouts: s.payouts.filter((x) => x.id !== p.id) })))}>Retirer</button>
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
                  ["catalogue", "Retirer aussi mes produits de la marketplace"],
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
                  <button className="btn-danger" disabled={pending || confirmName.trim() !== shop.shopName}>Fermer définitivement</button>
                  <button type="button" className="btn" onClick={() => setClosing(false)}>Annuler</button>
                </div>
              </form>
            )}
          </section>
        )}
        {closed && (
          <p className="card text-sm text-ash">Boutique fermée. {payouts.length === 0 ? "Aucun moyen de paiement n'est plus associé à votre compte." : `${payouts.length} compte(s) toujours enregistré(s) : vous pouvez les retirer ci-dessus.`}</p>
        )}
      </div>
      <section className="card self-start" aria-labelledby="nv">
        <h2 id="nv" className="mb-4 text-xl font-medium text-white">Notifications vendeur</h2>
        <NotificationPrefs role="vendeur" initial={live?.prefs} />
      </section>
    </div>
  );
}

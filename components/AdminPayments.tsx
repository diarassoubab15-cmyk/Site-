"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { planName } from "@/lib/plans";
import { paymentMethods } from "@/lib/payments";
import { formatPrice } from "@/lib/format";
import { callLink, whatsappLink } from "@/lib/contact";
import { toast } from "@/lib/toast";
import { update, useDemo, type DemoSubPayment, type SubPaymentStatus } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { adminConfirmPayment, adminMarkContacted, adminRejectPayment } from "@/app/actions";

const label: Record<SubPaymentStatus, [string, string]> = {
  contact: ["bg-amber", "attend votre contact"],
  paiement: ["bg-sky", "contacté · attend le paiement"],
  déclaré: ["bg-iris-glow", "paiement déclaré · à vérifier"],
  confirmé: ["bg-pulse", "payé"],
  refusé: ["bg-iron", "refusé / annulé"],
};

/** Paiements d'abonnement : l'admin confirme le contact, puis la réception de l'argent. */
export function AdminPayments({ live }: { live?: DemoSubPayment[] }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showDone, setShowDone] = useState(false);
  const all = supabaseEnabled ? live ?? [] : [...demo.subPayments].reverse();
  const open = all.filter((p) => ["contact", "paiement", "déclaré"].includes(p.status));
  const done = all.filter((p) => !open.includes(p)).slice(0, 20);

  function run(real: () => Promise<{ ok: boolean; error?: string }>, fake: () => void, success: string) {
    if (!supabaseEnabled) {
      fake();
      return toast(success);
    }
    start(async () => {
      const r = await real();
      toast(r.ok ? success : r.error ?? "Erreur", r.ok ? "ok" : "error");
      router.refresh();
    });
  }
  const setDemo = (id: string, patch: Partial<DemoSubPayment>) => update((s) => ({ ...s, subPayments: s.subPayments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  function confirm(p: DemoSubPayment) {
    run(
      () => adminConfirmPayment({ id: p.id }),
      () => {
        const until = new Date();
        if (p.annual) until.setFullYear(until.getFullYear() + 1);
        else until.setMonth(until.getMonth() + 1);
        setDemo(p.id, { status: "confirmé" });
        update((s) => ({ ...s, subscription: { plan: p.plan, annual: p.annual, active: true, until: until.toISOString() } }));
      },
      "Paiement confirmé : boutique en ligne",
    );
  }

  return (
    <section className="card" aria-labelledby="paiements-abo">
      <h2 id="paiements-abo" className="text-xl font-medium text-white">Paiements d&apos;abonnement</h2>
      <p className="mb-6 mt-2 text-sm text-ash">
        Un vendeur ne peut payer qu&apos;après votre échange sur WhatsApp ou par téléphone. Cliquez sur « Vendeur contacté » une fois cet échange fait : il verra alors votre numéro pour l&apos;opérateur qu&apos;il a choisi.
      </p>
      {open.length === 0 && <p className="text-sm text-iron">Aucun paiement en attente.</p>}
      <ul className="space-y-3" data-reveal suppressHydrationWarning>
        {open.map((p) => {
          const [dot, text] = label[p.status];
          const wa = `Bonjour ${p.owner ?? ""}, ici l'administrateur NEXORA au sujet de l'abonnement ${planName(p.plan)} de « ${p.shopName ?? "votre boutique"} » (référence ${p.ref}, ${formatPrice(p.amount)}).`;
          return (
            <li key={p.id} className="rounded-[6px] border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-white">
                  {p.shopName ?? "Boutique"} <span className="font-mono text-xs text-iris">{p.ref}</span>
                </p>
                <span className="flex items-center gap-2 font-mono text-xs text-bone"><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{text}</span>
              </div>
              <p className="mt-1 text-sm text-ash">
                {p.owner} · {p.ownerPhone} · {planName(p.plan)} {p.annual ? "annuel" : "mensuel"} · <span className="font-mono text-bone">{formatPrice(p.amount)}</span> · {paymentMethods[p.method ?? "orange_money"].label}
              </p>
              {p.status === "déclaré" && (
                <p className="mt-2 rounded-[6px] border border-iris/40 px-3 py-2 text-sm text-bone">
                  Transaction {paymentMethods[p.method ?? "orange_money"].label} <span className="font-mono text-iris">{p.operatorRef}</span> depuis le <span className="font-mono">{p.payerPhone}</span>. Vérifiez le SMS reçu sur votre téléphone avant de confirmer.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {p.ownerPhone && (
                  <>
                    <a href={whatsappLink(p.ownerPhone, wa)} target="_blank" rel="noopener noreferrer" className="btn px-3 py-1.5 text-xs">WhatsApp</a>
                    <a href={callLink(p.ownerPhone)} className="btn px-3 py-1.5 text-xs">Appeler</a>
                  </>
                )}
                {p.status === "contact" && (
                  <button className="btn-solid px-3 py-1.5 text-xs" data-haptic disabled={pending} onClick={() => run(() => adminMarkContacted({ id: p.id }), () => setDemo(p.id, { status: "paiement" }), "Vendeur contacté : il peut payer")}>
                    Vendeur contacté
                  </button>
                )}
                {(p.status === "déclaré" || p.status === "paiement") && (
                  <button className="btn-solid px-3 py-1.5 text-xs" data-haptic disabled={pending} onClick={() => confirm(p)}>
                    Paiement reçu
                  </button>
                )}
                <button
                  className="btn-danger px-3 py-1.5 text-xs"
                  disabled={pending}
                  onClick={() => {
                    const note = window.prompt("Motif (visible par le vendeur) :", p.status === "déclaré" ? "Paiement non reçu" : "Demande refusée");
                    if (note === null) return;
                    run(() => adminRejectPayment({ id: p.id, note }), () => setDemo(p.id, { status: "refusé", adminNote: note }), "Demande refusée");
                  }}
                >
                  {p.status === "déclaré" ? "Pas reçu" : "Refuser"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {done.length > 0 && (
        <div className="mt-6">
          <button className="text-sm text-ash hover:text-white" onClick={() => setShowDone(!showDone)}>{showDone ? "Masquer" : "Voir"} l&apos;historique ({done.length})</button>
          {showDone && (
            <ul className="mt-3 divide-y divide-line text-sm">
              {done.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="text-bone">{p.shopName} <span className="font-mono text-xs text-iris">{p.ref}</span></span>
                  <span className="font-mono text-xs text-ash">{formatPrice(p.amount)} · {label[p.status][1]}{p.adminNote ? ` · ${p.adminNote}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

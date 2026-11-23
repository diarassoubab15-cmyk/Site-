"use client";
import { PhoneInput } from "./PhoneInput";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SuccessCheck } from "./SuccessCheck";
import { plans, planName, ANNUAL_MONTHS_PAID } from "@/lib/plans";
import { formatDate, formatPrice } from "@/lib/format";
import { paymentMethods } from "@/lib/payments";
import { site } from "@/lib/site";
import { callLink, whatsappLink } from "@/lib/contact";
import { toast } from "@/lib/toast";
import { today, uid, update, useDemo, type DemoSubPayment } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { LiveSeller } from "@/lib/views";
import { cancelSubscriptionPayment, declareSubscriptionPayment, requestSubscriptionPayment } from "@/app/actions";

const amountFor = (plan: string, annual: boolean) => (plans.find((p) => p.id === plan)?.monthly ?? 0) * (annual ? ANNUAL_MONTHS_PAID : 1);

const steps = ["Contacter l'admin", "Payer", "Vérification"];

type SubMethod = NonNullable<DemoSubPayment["method"]>;
const methodLabel = (m?: SubMethod) => paymentMethods[m ?? "orange_money"].label;

/**
 * Paiement de l'abonnement par Mobile Money (Orange Money, Wave, MTN MoMo, Moov Money).
 * Règle : le vendeur DOIT contacter l'administrateur (WhatsApp ou appel) avant tout paiement.
 * Les coordonnées de paiement ne s'affichent qu'après que l'admin a confirmé cet échange.
 */
export function SubscriptionPanel({
  shop,
  live,
}: {
  shop: { id: string; shopName: string; status: string; plan: string | null };
  live?: LiveSeller | null;
}) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const subscription = supabaseEnabled ? live?.subscription ?? null : demo.subscription ? { ...demo.subscription, until: demo.subscription.until ?? null } : null;
  const payment: DemoSubPayment | null = supabaseEnabled ? live?.payment ?? null : demo.subPayments.filter((p) => p.shopId === shop.id).at(-1) ?? null;
  const payInfo = supabaseEnabled ? live?.payInfo ?? null : payment?.status === "paiement" ? { number: "+223 70 00 00 00 (démo)", name: "NEXORA" } : null;
  const ownerName = supabaseEnabled ? live?.owner.name ?? "" : demo.profile?.name ?? "";
  const ownerPhone = supabaseEnabled ? live?.owner.phone ?? "" : demo.profile?.phone ?? "";

  const [plan, setPlan] = useState(shop.plan ?? "pro");
  const [annual, setAnnual] = useState(false);
  const methods: SubMethod[] = supabaseEnabled ? live?.payMethods ?? ["orange_money"] : ["orange_money", "wave", "mtn_momo", "moov_money"];
  const [method, setMethod] = useState<SubMethod>("orange_money");
  const [operatorRef, setOperatorRef] = useState("");
  const [payerPhone, setPayerPhone] = useState(ownerPhone);

  const open = payment && ["contact", "paiement", "déclaré"].includes(payment.status) ? payment : null;
  // Couverture : abonnement payé, prolongé par les mois offerts qui s'enchaînent.
  const rewards = supabaseEnabled ? live?.rewards ?? [] : demo.rewards.filter((r) => r.shopId === shop.id && !r.revoked);
  const paidOpenEnded = !!subscription?.active && !subscription.until && !live?.coveredUntil;
  let covered: Date | null = supabaseEnabled && live?.coveredUntil ? new Date(live.coveredUntil) : null;
  if (!supabaseEnabled) {
    let e = Math.max(Date.now(), subscription?.active && subscription.until ? new Date(subscription.until).getTime() : 0);
    [...rewards].filter((r) => r.freeMonths > 0).sort((a, b) => a.startsOn!.localeCompare(b.startsOn!)).forEach((r) => {
      const s = new Date(r.startsOn!).getTime(), f = new Date(r.endsOn!).getTime();
      if (s <= e && f > e) e = f;
    });
    covered = new Date(e);
  }
  const until = paidOpenEnded ? null : covered;
  const activeNow = paidOpenEnded || (!!until && until.getTime() > Date.now() + 60_000);
  const freeNow = rewards.some((r) => r.freeMonths > 0 && new Date(r.startsOn!) <= new Date() && new Date(r.endsOn!) > new Date());
  const upcomingFree = rewards.filter((r) => r.freeMonths > 0 && new Date(r.startsOn!) > new Date());
  const daysLeft = until ? Math.ceil((until.getTime() - Date.now()) / 86400000) : null;
  const canRenew = !activeNow || (daysLeft !== null && daysLeft <= 7);

  // En attente de l'admin : la page se met à jour d'elle-même (toutes les 20 s, onglet visible).
  useEffect(() => {
    if (!supabaseEnabled || !open || open.status === "paiement") return;
    const t = setInterval(() => !document.hidden && router.refresh(), 20000);
    return () => clearInterval(t);
  }, [open, router]);

  function run(real: () => Promise<{ ok: boolean; error?: string }>, fake: () => void, success: string) {
    setError("");
    if (!supabaseEnabled) {
      fake();
      return toast(success);
    }
    start(async () => {
      const r = await real();
      if (!r.ok) {
        setError(r.error ?? "Erreur");
        return toast(r.error ?? "Erreur", "error");
      }
      toast(success);
      router.refresh();
    });
  }

  if (shop.status !== "autorisé") {
    return (
      <section className="card" aria-labelledby="abo">
        <h2 id="abo" className="text-xl font-medium text-white">Abonnement</h2>
        <p className="mt-3 text-sm text-ash">Le paiement de l&apos;abonnement sera possible dès que l&apos;administrateur aura autorisé votre boutique.</p>
      </section>
    );
  }

  const waText = open
    ? `Bonjour, je suis ${ownerName || "vendeur"} de la boutique « ${shop.shopName} » sur NEXORA. Je souhaite payer mon abonnement ${planName(open.plan)} (${open.annual ? "annuel" : "mensuel"}) : ${formatPrice(open.amount)} par ${methodLabel(open.method)}. Référence : ${open.ref}.`
    : "";
  const stepIndex = open ? { contact: 0, paiement: 1, déclaré: 2 }[open.status as "contact" | "paiement" | "déclaré"] : -1;

  return (
    <section className="card space-y-6" aria-labelledby="abo">
      <div>
        <h2 id="abo" className="text-xl font-medium text-white">Abonnement</h2>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <span className={`h-2 w-2 rounded-full ${activeNow ? "bg-pulse" : "bg-amber"}`} aria-hidden="true" />
          {activeNow ? (
            <span className="text-bone">
              {freeNow ? "Mois offert en cours" : `${planName(subscription?.plan ?? shop.plan ?? "pro")} actif`}{until ? ` · couvert jusqu'au ${formatDate(until.toISOString())}` : ""} · votre boutique est visible
            </span>
          ) : subscription?.until ? (
            <span className="text-amber">Expiré le {formatDate(subscription.until)} : votre boutique n&apos;est plus visible</span>
          ) : (
            <span className="text-amber">Pas encore payé : votre boutique n&apos;est pas visible des clients</span>
          )}
        </p>
      </div>

      {upcomingFree.length > 0 && (
        <p className="text-sm text-amber">
          🎁 {upcomingFree.map((r) => `${r.freeMonths} mois offert${r.freeMonths > 1 ? "s" : ""} à partir du ${formatDate(r.startsOn!)}`).join(" · ")} : rien à payer pour cette période.
        </p>
      )}
      {error && <p className="rounded-[6px] border border-alarm/40 px-4 py-3 text-sm text-alarm" role="alert">{error}</p>}
      {payment?.status === "refusé" && payment.adminNote && !open && (
        <p className="rounded-[6px] border border-line px-4 py-3 text-sm text-ash">Dernière demande {payment.ref} : {payment.adminNote}.</p>
      )}

      {open && (
        <ol className="flex flex-wrap gap-2 font-mono text-xs" aria-label="Étapes du paiement">
          {steps.map((s, i) => (
            <li key={s} aria-current={i === stepIndex ? "step" : undefined} className={`rounded-[6px] border px-2.5 py-1 ${i === stepIndex ? "border-white text-white" : i < stepIndex ? "border-line text-pulse" : "border-line text-iron"}`}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      )}

      {/* Aucune demande en cours : choisir le forfait */}
      {!open && canRenew && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => requestSubscriptionPayment({ plan, annual, method }),
              () => update((s) => ({ ...s, subPayments: [...s.subPayments, { id: uid("AB"), ref: uid("AB"), shopId: shop.id, shopName: shop.shopName, owner: ownerName, ownerPhone, plan, annual, method, amount: amountFor(plan, annual), status: "contact", createdAt: today() }] })),
              "Demande créée : contactez l'administrateur",
            );
          }}
        >
          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="label">Forfait</legend>
            {plans.map((p) => (
              <label key={p.id} className={`flex cursor-pointer flex-col rounded-[6px] border px-3 py-2.5 text-sm ${plan === p.id ? "border-white text-white" : "border-line text-bone"}`}>
                <span className="flex items-center gap-2"><input type="radio" name="plan" checked={plan === p.id} onChange={() => setPlan(p.id)} className="accent-[#9281f7]" />{p.name}</span>
                <span className="mt-1 font-mono text-xs text-ash">{formatPrice(p.monthly)}/mois</span>
              </label>
            ))}
          </fieldset>
          {methods.length > 1 && (
            <fieldset className="grid gap-2 sm:grid-cols-4">
              <legend className="label">Payer avec</legend>
              {methods.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-2 rounded-[6px] border px-3 py-2 text-sm ${method === m ? "border-white text-white" : "border-line text-bone"}`}>
                  <input type="radio" name="sub-method" checked={method === m} onChange={() => setMethod(m)} className="accent-[#9281f7]" />{methodLabel(m)}
                </label>
              ))}
            </fieldset>
          )}
          <label className="flex items-center gap-3 text-sm text-bone">
            <input type="checkbox" checked={annual} onChange={(e) => setAnnual(e.target.checked)} className="accent-[#9281f7]" />
            Payer pour un an (2 mois offerts)
          </label>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
            <p className="text-sm text-ash">À payer : <span className="font-mono text-lg text-white">{formatPrice(amountFor(plan, annual))}</span></p>
            <button className="btn-solid" data-haptic disabled={pending}>{pending ? "…" : activeNow ? "Renouveler mon abonnement" : "Payer mon abonnement"}</button>
          </div>
          <p className="text-xs text-iron">Paiement par {methodLabel(method)}. Vous devrez d&apos;abord contacter l&apos;administrateur sur WhatsApp ou par téléphone.</p>
        </form>
      )}

      {!open && !canRenew && <p className="text-xs text-iron">Le renouvellement sera possible 7 jours avant l&apos;échéance.</p>}

      {/* Étape 1 : contact obligatoire */}
      {open?.status === "contact" && (
        <div className="pop space-y-4 rounded-[16px] border border-amber/40 p-5">
          <p className="text-white">
            <strong>Étape obligatoire :</strong> contactez l&apos;administrateur avant tout paiement.
          </p>
          <p className="text-sm text-ash">
            Abonnement {planName(open.plan)} {open.annual ? "annuel" : "mensuel"} · <span className="font-mono text-bone">{formatPrice(open.amount)}</span> · référence <span className="font-mono text-iris">{open.ref}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={whatsappLink(site.support.whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="btn-solid" data-haptic>
              <span className="h-2 w-2 rounded-full bg-pulse" aria-hidden="true" />Écrire sur WhatsApp
            </a>
            <a href={callLink(site.support.phone)} className="btn" data-haptic>Appeler le {site.support.phoneDisplay}</a>
          </div>
          <p className="text-sm text-amber">
            N&apos;envoyez aucun argent pour l&apos;instant. Les coordonnées de paiement apparaîtront ici dès que l&apos;administrateur aura confirmé votre échange.
          </p>
          <button type="button" className="text-xs text-ash hover:text-white" disabled={pending}
            onClick={() => run(() => cancelSubscriptionPayment({ id: open.id }), () => update((s) => ({ ...s, subPayments: s.subPayments.map((p) => (p.id === open.id ? { ...p, status: "refusé", adminNote: "Annulée par le vendeur" } : p)) })), "Demande annulée")}>
            Annuler cette demande
          </button>
        </div>
      )}

      {/* Étape 2 : l'admin a confirmé le contact → coordonnées + déclaration */}
      {open?.status === "paiement" && payInfo && (
        <form
          className="pop space-y-4 rounded-[16px] border border-pulse/40 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => declareSubscriptionPayment({ id: open.id, operatorRef, payerPhone }),
              () => update((s) => ({ ...s, subPayments: s.subPayments.map((p) => (p.id === open.id ? { ...p, status: "déclaré", operatorRef, payerPhone } : p)) })),
              "Paiement déclaré : l'administrateur vérifie",
            );
          }}
        >
          <p className="flex items-center gap-3 text-white"><SuccessCheck size={22} />L&apos;administrateur a confirmé votre échange. Vous pouvez payer.</p>
          <dl className="grid gap-2 rounded-[6px] border border-line p-4 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-ash">Envoyer par</dt><dd className="text-white">{methodLabel(open.method)}</dd>
            <dt className="text-ash">Au numéro</dt><dd className="font-mono text-lg text-iris">{payInfo.number}</dd>
            <dt className="text-ash">Au nom de</dt><dd className="text-white">{payInfo.name}</dd>
            <dt className="text-ash">Montant exact</dt><dd className="font-mono text-lg text-white">{formatPrice(open.amount)}</dd>
            <dt className="text-ash">Référence</dt><dd className="font-mono text-iris">{open.ref}</dd>
          </dl>
          <p className="text-sm text-ash">Après l&apos;envoi, vous recevez un SMS de {methodLabel(open.method)} avec un numéro de transaction. Saisissez-le ci-dessous.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="opref" className="label">Numéro de transaction (SMS)</label><input id="opref" required minLength={4} maxLength={40} className="input font-mono" value={operatorRef} onChange={(e) => setOperatorRef(e.target.value)} /></div>
            <PhoneInput id="payer" label="Numéro qui a payé" required value={payerPhone} onChange={setPayerPhone} />
          </div>
          <button className="btn-solid" data-haptic disabled={pending}>{pending ? "Envoi…" : "J'ai payé"}</button>
        </form>
      )}

      {/* Étape 3 : vérification par l'admin */}
      {open?.status === "déclaré" && (
        <div className="pop space-y-2 rounded-[16px] border border-line p-5">
          <p className="flex items-center gap-3 text-white"><SuccessCheck size={22} />Paiement déclaré, en cours de vérification.</p>
          <p className="text-sm text-ash">
            Transaction <span className="font-mono text-iris">{open.operatorRef}</span> · {formatPrice(open.amount)}. Votre boutique sera visible dès que l&apos;administrateur aura vu l&apos;argent arriver.
          </p>
        </div>
      )}
    </section>
  );
}

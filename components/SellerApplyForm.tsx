"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { categories } from "@/lib/data";
import { plans } from "@/lib/plans";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { today, uid, update, useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { applySeller } from "@/app/actions";
import type { KnownUser } from "@/lib/server-data";

const steps = ["Boutique", "Vous", "Encaissement", "Forfait"] as const;
const payoutChoices: (PaymentMethodId | "bank")[] = ["orange_money", "wave", "mtn_momo", "moov_money", "bank"];
const payoutLabel = (m: PaymentMethodId | "bank") => (m === "bank" ? "Compte bancaire" : paymentMethods[m].label);

export function SellerApplyForm({ initialPlan, known }: { initialPlan: string; known?: KnownUser | null }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const d = demo.onboardingDraft;
  // Le brouillon est sauvegardé à chaque saisie : quitter la page ne fait rien perdre,
  // et une question déjà répondue n'est jamais reposée.
  const set = (k: string, v: string) => update((s) => ({ ...s, onboardingDraft: { ...s.onboardingDraft, [k]: v } }));
  const val = (k: string, fallback = "") => d[k] ?? fallback;

  useEffect(() => {
    if (!d.plan) set("plan", initialPlan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myShop = supabaseEnabled ? (known?.shopStatus ? { status: known.shopStatus } : null) : demo.sellers.find((x) => x.id === demo.myShopId);
  if (supabaseEnabled && !known) {
    return (
      <div className="card space-y-4">
        <p className="text-white">Connectez-vous pour demander l&apos;ouverture de votre boutique.</p>
        <p className="text-sm text-ash">Un code reçu par e-mail ou SMS suffit. Vos réponses seront reprises ensuite.</p>
        <a href="/connexion?next=/vendre" className="btn-solid">Se connecter</a>
      </div>
    );
  }
  if (myShop) {
    return (
      <div className="card space-y-4" role="status">
        <p className="eyebrow">Statut de votre demande</p>
        <p className="text-2xl text-white">{myShop.status === "en attente" ? "En cours de vérification" : `Boutique ${myShop.status}`}</p>
        <p className="text-ash">
          {myShop.status === "en attente"
            ? "L'administrateur vérifie votre demande, en général sous 24 à 48 h. Vous recevrez un seul e-mail avec la décision. Aucun paiement n'est prélevé avant l'autorisation."
            : "Retrouvez votre boutique et vos réglages dans l'espace vendeur."}
        </p>
        <Link href="/vendeur" className="btn">Espace vendeur</Link>
      </div>
    );
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step < steps.length - 1) return setStep(step + 1);
    if (supabaseEnabled) {
      start(async () => {
        const r = await applySeller({
          shopName: val("shopName"), category: val("category"), city: val("city", p?.city), country: val("country", p?.country),
          owner: val("owner", p?.name), email: val("email", p?.email), phone: val("phone", p?.phone),
          payoutMethod: val("payoutMethod", "orange_money"), payoutAccount: val("payoutAccount"), cod: val("cod", "1") === "1", plan: val("plan", "pro"),
        });
        if (!r.ok) return setError(r.error);
        update((s) => ({ ...s, onboardingDraft: {} }));
        router.refresh();
      });
      return;
    }
    const method = val("payoutMethod", "orange_money") as PaymentMethodId | "bank";
    const account = val("payoutAccount");
    const shopId = uid("S");
    update((s) => ({
      ...s,
      profile: s.profile ?? { name: val("owner"), email: val("email"), phone: val("phone"), city: val("city"), country: val("country") },
      sellers: [{ id: shopId, shopName: val("shopName"), owner: val("owner"), email: val("email"), phone: val("phone"), city: val("city"), country: val("country"), category: val("category"), status: "en attente", createdAt: today() }, ...s.sellers],
      payouts: [{ id: uid("P"), type: method, label: payoutLabel(method), masked: `•••• ${account.replace(/\s/g, "").slice(-4)}` }],
      myShopId: shopId,
      subscription: { plan: val("plan", "pro"), annual: false, active: false },
      onboardingDraft: {},
    }));
  }

  const p = supabaseEnabled ? known : demo.profile;
  return (
    <form onSubmit={next} className="card space-y-6">
      <ol className="flex flex-wrap gap-2 font-mono text-xs" aria-label="Étapes">
        {steps.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => i < step && setStep(i)} className={`rounded-[6px] border px-2.5 py-1 ${i === step ? "border-white text-white" : i < step ? "border-line text-pulse" : "border-line text-iron"}`} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label" htmlFor="shopName">Nom de la boutique</label><input id="shopName" required maxLength={60} className="input" value={val("shopName")} onChange={(e) => set("shopName", e.target.value)} /></div>
          <div><label className="label" htmlFor="category">Catégorie principale</label>
            <select id="category" required className="input" value={val("category")} onChange={(e) => set("category", e.target.value)}>
              <option value="">Choisir…</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label" htmlFor="city">Ville</label><input id="city" required className="input" value={val("city", p?.city)} onChange={(e) => set("city", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="country">Pays</label><input id="country" required className="input" value={val("country", p?.country)} onChange={(e) => set("country", e.target.value)} /></div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Champs pré-remplis depuis le compte : rien n'est redemandé */}
          <div className="sm:col-span-2"><label className="label" htmlFor="owner">Nom du responsable</label><input id="owner" required autoComplete="name" className="input" value={val("owner", p?.name)} onChange={(e) => set("owner", e.target.value)} /></div>
          <div><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" required autoComplete="email" className="input" value={val("email", p?.email)} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className="label" htmlFor="phone">Téléphone</label><input id="phone" required inputMode="tel" pattern="[+0-9 ]{8,}" autoComplete="tel" className="input" value={val("phone", p?.phone)} onChange={(e) => set("phone", e.target.value)} /></div>
          <p className="text-xs text-iron sm:col-span-2">Une pièce d&apos;identité vous sera demandée par e-mail sécurisé, une seule fois, pour la vérification.</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-ash">Où voulez-vous recevoir l&apos;argent de vos clients ? Il arrive <strong className="text-white">directement</strong> sur ce compte, sans passer par NEXORA.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {payoutChoices.map((m) => (
              <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-2.5 text-sm ${val("payoutMethod", "orange_money") === m ? "border-white text-white" : "border-line text-bone"}`}>
                <input type="radio" name="payoutMethod" checked={val("payoutMethod", "orange_money") === m} onChange={() => set("payoutMethod", m)} className="accent-[#9281f7]" />
                {payoutLabel(m)}
              </label>
            ))}
          </div>
          <div><label className="label" htmlFor="payoutAccount">{val("payoutMethod", "orange_money") === "bank" ? "IBAN / RIB" : "Numéro marchand ou de téléphone"}</label><input id="payoutAccount" required className="input font-mono" value={val("payoutAccount")} onChange={(e) => set("payoutAccount", e.target.value)} /></div>
          <label className="flex items-center gap-3 text-sm text-bone"><input type="checkbox" checked={val("cod", "1") === "1"} onChange={(e) => set("cod", e.target.checked ? "1" : "0")} className="accent-[#9281f7]" />J&apos;accepte le paiement à la livraison</label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          {plans.map((pl) => (
            <label key={pl.id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-[6px] border px-4 py-3 ${val("plan") === pl.id ? "border-white" : "border-line"}`}>
              <span className="flex items-center gap-3"><input type="radio" name="plan" checked={val("plan") === pl.id} onChange={() => set("plan", pl.id)} className="accent-[#9281f7]" /><span className="text-white">{pl.name}</span><span className="text-xs text-ash">{pl.products}</span></span>
              <span className="font-mono text-sm text-bone">{pl.monthly.toLocaleString("fr-FR")} FCFA/mois</span>
            </label>
          ))}
          <p className="text-xs text-iron">Aucun prélèvement avant l&apos;autorisation de votre boutique par l&apos;administrateur.</p>
        </div>
      )}

      <div className="flex justify-between gap-3 border-t border-line pt-5">
        <button type="button" className="btn" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Retour</button>
        <button type="submit" className="btn-solid" disabled={pending}>{pending ? "Envoi…" : step === steps.length - 1 ? "Envoyer ma demande" : "Continuer"}</button>
      </div>
      {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
      <p className="font-mono text-xs text-iron">brouillon enregistré automatiquement</p>
    </form>
  );
}

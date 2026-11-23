"use client";
import { PhoneInput } from "./PhoneInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { categories } from "@/lib/data";
import { plans } from "@/lib/plans";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { getShopType, SHOP_TYPES } from "@/lib/shop-types";
import { coordsFromMapsUrl, isMapsUrl, mapsLinkFromCoords } from "@/lib/maps";
import { today, uid, update, useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { applySeller } from "@/app/actions";
import type { KnownUser } from "@/lib/server-data";
import { SuccessCheck } from "./SuccessCheck";
import { ShopTypeIcon } from "./ShopTypeIcon";

const steps = ["Boutique", "Adresse", "Contact", "Argent reçu", "Forfait"] as const;
/** Titre et explication de chaque étape, en mots simples. */
const stepHelp: [string, string][] = [
  ["Votre boutique", "Son nom, ce que vous vendez, et quelques exemples de prix. Vous ajouterez tous vos produits et leurs photos plus tard."],
  ["Où se trouve votre boutique ?", "Pour que les clients de votre ville vous trouvent. Si vous vendez seulement en ligne, indiquez juste le pays et la ville."],
  ["Comment vos clients vous joignent", "Les boutons « WhatsApp » et « Appeler » de votre boutique utiliseront ces numéros."],
  ["Où recevoir l'argent de vos ventes", "Vos clients vous paient directement sur ce compte. NEXORA ne prend aucune commission."],
  ["Choisissez votre forfait", "Rien à payer aujourd'hui : vous paierez seulement après la vérification de votre boutique. Vous pourrez changer de forfait plus tard."],
];
const payoutChoices: (PaymentMethodId | "bank")[] = ["orange_money", "wave", "mtn_momo", "moov_money", "bank"];
const payoutLabel = (m: PaymentMethodId | "bank") => (m === "bank" ? "Compte bancaire" : paymentMethods[m].label);
type Sample = { name: string; price: string };
const PHONE_RE = /^[+0-9 ]{8,20}$/;
const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

/**
 * Création de boutique en 5 étapes courtes, avec aperçu en direct de la fiche telle que les clients la verront.
 * Brouillon sauvegardé à chaque saisie ; ce que le compte connaît déjà n'est jamais redemandé.
 */
export function SellerApplyForm({ initialPlan, known }: { initialPlan: string; known?: KnownUser | null }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [locating, setLocating] = useState(false);
  const d = demo.onboardingDraft;
  const set = (k: string, v: string) => update((s) => ({ ...s, onboardingDraft: { ...s.onboardingDraft, [k]: v } }));
  const val = (k: string, fallback = "") => d[k] ?? fallback;
  const p = supabaseEnabled ? known : demo.profile;

  useEffect(() => {
    if (!d.plan) set("plan", initialPlan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let samples: Sample[] = [{ name: "", price: "" }];
  try { const s = JSON.parse(val("samples", "[]")) as Sample[]; if (Array.isArray(s) && s.length) samples = s; } catch { /* brouillon illisible : on repart d'une ligne vide */ }
  const setSamples = (list: Sample[]) => set("samples", JSON.stringify(list));
  const physical = val("physical", "0") === "1";
  const whatsapp = val("whatsapp", p?.phone ?? "");
  const callPhone = val("callPhone", whatsapp);

  const myShop = supabaseEnabled ? (known?.shopStatus ? { status: known.shopStatus } : null) : demo.sellers.find((x) => x.id === demo.myShopId);
  if (supabaseEnabled && !known) {
    return (
      <div className="card space-y-4">
        <p className="text-lg font-medium text-white">D&apos;abord, votre compte NEXORA</p>
        <p className="text-sm text-ash">Il faut un compte pour gérer votre boutique. Pas encore de compte ? Inscrivez-vous en 1 minute avec votre e-mail, puis revenez ici automatiquement.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/connexion?mode=inscription&next=/vendre" className="btn-solid">Créer mon compte</a>
          <a href="/connexion?next=/vendre" className="btn">J&apos;ai déjà un compte</a>
        </div>
      </div>
    );
  }
  if (myShop) {
    return (
      <div className="card pop space-y-4" role="status">
        <p className="flex items-center gap-3 text-sm text-ash">{myShop.status === "en attente" && <SuccessCheck size={22} />}Statut de votre demande</p>
        <p className="text-2xl text-white">{myShop.status === "en attente" ? "En cours de vérification" : `Boutique ${myShop.status}`}</p>
        <p className="text-ash">
          {myShop.status === "en attente"
            ? "L'administrateur vérifie votre demande, en général sous 24 à 48 h. Vous recevrez un seul e-mail avec la décision. Vous paierez votre abonnement seulement après l'autorisation."
            : "Retrouvez votre boutique et vos réglages dans l'espace vendeur."}
        </p>
        <Link href="/vendeur" className="btn">Ma boutique</Link>
      </div>
    );
  }

  function locate() {
    if (!navigator.geolocation) return setError("Votre téléphone ne permet pas la localisation : collez plutôt le lien Google Maps.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        update((s) => ({ ...s, onboardingDraft: { ...s.onboardingDraft, lat: String(latitude), lng: String(longitude), mapsUrl: mapsLinkFromCoords(latitude, longitude) } }));
        setLocating(false);
        setError("");
      },
      () => { setLocating(false); setError("Position refusée ou indisponible : collez le lien Google Maps de votre boutique."); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  /** Vérifications propres à chaque étape (le serveur et la base revérifient tout). */
  function check(): string {
    if (step === 0) {
      const filled = samples.filter((s) => s.name.trim() || s.price.trim());
      if (!filled.length) return "Indiquez au moins un produit et son prix.";
      if (filled.some((s) => !s.name.trim() || !(Number(s.price.replace(/\D/g, "")) > 0))) return "Chaque produit a besoin d'un nom et d'un prix.";
    }
    if (step === 1 && physical) {
      const url = val("mapsUrl").trim();
      if (!url && !val("lat")) return "Boutique physique : collez le lien Google Maps ou touchez « Ma position actuelle ».";
      if (url && !isMapsUrl(url)) return "Ce lien n'est pas un lien Google Maps (google.com/maps ou maps.app.goo.gl).";
    }
    if (step === 2 && (!PHONE_RE.test(whatsapp.trim()) || !PHONE_RE.test(callPhone.trim()))) return "Numéro invalide : chiffres, espaces et « + » seulement.";
    return "";
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    const problem = check();
    if (problem) return setError(problem);
    setError("");
    if (step < steps.length - 1) return setStep(step + 1);
    const cleanSamples = samples.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), price: Number(s.price.replace(/\D/g, "")) }));
    const mapsUrl = physical ? val("mapsUrl").trim() : "";
    const coords = physical ? (val("lat") ? { lat: Number(val("lat")), lng: Number(val("lng")) } : coordsFromMapsUrl(mapsUrl)) : null;
    if (supabaseEnabled) {
      start(async () => {
        const r = await applySeller({
          shopName: val("shopName"), category: val("category"), samples: cleanSamples,
          country: val("country", p?.country), city: val("city", p?.city), district: val("district"),
          isPhysical: physical, mapsUrl, lat: coords?.lat ?? null, lng: coords?.lng ?? null,
          whatsapp: whatsapp.trim(), callPhone: callPhone.trim(),
          owner: val("owner", p?.name), email: val("email", p?.email),
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
      profile: s.profile ?? { name: val("owner"), email: val("email"), phone: callPhone, city: val("city"), country: val("country") },
      sellers: [{ id: shopId, shopName: val("shopName"), owner: val("owner"), email: val("email"), phone: callPhone, city: val("city"), country: val("country"), category: val("category"), status: "en attente", createdAt: today() }, ...s.sellers],
      payouts: [{ id: uid("P"), type: method, label: payoutLabel(method), masked: `•••• ${account.replace(/\s/g, "").slice(-4)}` }],
      myShopId: shopId,
      subscription: { plan: val("plan", "pro"), annual: false, active: false },
      onboardingDraft: {},
    }));
  }

  const type = getShopType(val("category"));
  const accent = type?.color ?? "#5433eb";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
      <form onSubmit={next} className="card space-y-6" noValidate={false}>
        {/* Progression : barre + étapes (on peut revenir sur une étape déjà remplie) */}
        <div>
          <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full transition-transform duration-300 ease-out" style={{ background: accent, transform: `translateX(${((step + 1) / steps.length) * 100 - 100}%)` }} />
          </div>
          <ol className="mt-3 flex flex-wrap gap-2 font-mono text-xs" aria-label="Étapes">
            {steps.map((s, i) => (
              <li key={s}>
                <button type="button" onClick={() => i < step && setStep(i)} className={`rounded-[6px] border px-2.5 py-1 ${i === step ? "border-white text-white" : i < step ? "border-line text-pulse" : "border-line text-iron"}`} aria-current={i === step ? "step" : undefined}>
                  {i + 1}. {s}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="font-mono text-xs text-iron">Étape {step + 1} sur {steps.length}</p>
          <h2 className="mt-1 text-2xl font-medium text-white">{stepHelp[step][0]}</h2>
          <p className="mt-1 text-sm text-ash">{stepHelp[step][1]}</p>
        </div>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="shopName">Nom de la boutique</label><input id="shopName" required maxLength={60} className="input" value={val("shopName")} onChange={(e) => set("shopName", e.target.value)} placeholder="Ex. : Atelier Kenté" /></div>
            <fieldset className="sm:col-span-2">
              <legend className="label">Que vendez-vous ? <span className="text-iron">(touchez une case)</span></legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SHOP_TYPES.map((t) => {
                  const on = val("category") === t.slug;
                  return (
                    <label key={t.slug} className={`flex cursor-pointer flex-col items-center gap-2 rounded-[18px] border px-2 py-3 text-center text-sm transition-colors ${on ? "text-white" : "border-line text-bone hover:border-iron"}`}
                      style={on ? { borderColor: t.color, background: `color-mix(in srgb, ${t.color} 8%, transparent)` } : undefined}>
                      <input type="radio" name="category" required value={t.slug} checked={on} onChange={() => set("category", t.slug)} className="sr-only" />
                      <span style={{ color: t.color }}><ShopTypeIcon slug={t.slug} size={28} /></span>
                      {t.name}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="label">Quelques produits et leurs prix <span className="text-iron">(1 à 5, pour présenter votre boutique)</span></legend>
              {samples.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label={`Produit ${i + 1}`} className="input flex-1" maxLength={60} placeholder="Produit" value={s.name} onChange={(e) => setSamples(samples.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input aria-label={`Prix du produit ${i + 1} en FCFA`} className="input w-32 font-mono" inputMode="numeric" placeholder="Prix FCFA" value={s.price} onChange={(e) => setSamples(samples.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/[^\d ]/g, "") } : x)))} />
                  {samples.length > 1 && <button type="button" className="btn px-3" aria-label={`Retirer le produit ${i + 1}`} onClick={() => setSamples(samples.filter((_, j) => j !== i))}>×</button>}
                </div>
              ))}
              {samples.length < 5 && <button type="button" className="text-sm text-ash hover:text-white" onClick={() => setSamples([...samples, { name: "", price: "" }])}>+ Ajouter un produit</button>}
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="country">Pays</label><input id="country" required autoComplete="country-name" className="input" value={val("country", p?.country)} onChange={(e) => set("country", e.target.value)} /></div>
            <div><label className="label" htmlFor="city">Ville</label><input id="city" required autoComplete="address-level2" className="input" value={val("city", p?.city)} onChange={(e) => set("city", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="district">Quartier <span className="text-iron">(facultatif)</span></label><input id="district" maxLength={80} className="input" placeholder="Ex. : ACI 2000, Hamdallaye" value={val("district")} onChange={(e) => set("district", e.target.value)} /></div>
            <label className="flex items-center gap-3 rounded-[6px] border border-line px-3 py-3 text-sm text-bone sm:col-span-2">
              <input type="checkbox" checked={physical} onChange={(e) => set("physical", e.target.checked ? "1" : "0")} className="accent-[#5433eb]" />
              Les clients peuvent venir à ma boutique (boutique physique)
            </label>
            {physical && (
              <div className="space-y-3 sm:col-span-2">
                <div><label className="label" htmlFor="mapsUrl">Lien Google Maps de la boutique</label>
                  <input id="mapsUrl" inputMode="url" className="input font-mono text-xs" placeholder="https://maps.app.goo.gl/…" value={val("mapsUrl")} onChange={(e) => update((s) => ({ ...s, onboardingDraft: { ...s.onboardingDraft, mapsUrl: e.target.value, lat: "", lng: "" } }))} />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <button type="button" className="btn" onClick={locate} disabled={locating}>{locating ? "Localisation…" : "Ma position actuelle"}</button>
                  {val("lat") && <span className="font-mono text-xs text-pulse">position enregistrée ✓</span>}
                </div>
                <p className="text-xs text-iron">Dans Google Maps : touchez votre boutique, puis « Partager », puis « Copier le lien ». Ou, si vous êtes dans la boutique, touchez « Ma position actuelle ».</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <PhoneInput id="whatsapp" label="Numéro WhatsApp" required value={whatsapp} onChange={(v) => set("whatsapp", v)} />
            <PhoneInput id="callPhone" label="Numéro pour les appels" required value={callPhone} onChange={(v) => set("callPhone", v)} />
            <p className="-mt-2 text-xs text-iron sm:col-span-2">Ces deux numéros s&apos;affichent sur votre boutique (boutons « WhatsApp » et « Appeler »). Même numéro ? Laissez le second tel quel.</p>
            {/* Déjà connus par le compte : pré-remplis, rien n'est redemandé */}
            <div><label className="label" htmlFor="owner">Nom du responsable</label><input id="owner" required autoComplete="name" className="input" value={val("owner", p?.name)} onChange={(e) => set("owner", e.target.value)} /></div>
            <div><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" required autoComplete="email" className="input" value={val("email", p?.email)} onChange={(e) => set("email", e.target.value)} /></div>
            <p className="text-xs text-iron sm:col-span-2">Le nom et l&apos;e-mail du responsable restent privés : seul l&apos;administrateur les voit. Une pièce d&apos;identité vous sera demandée une seule fois, par e-mail sécurisé.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
                        <div className="grid gap-2 sm:grid-cols-2">
              {payoutChoices.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-[6px] border px-3 py-2.5 text-sm ${val("payoutMethod", "orange_money") === m ? "border-white text-white" : "border-line text-bone"}`}>
                  <input type="radio" name="payoutMethod" checked={val("payoutMethod", "orange_money") === m} onChange={() => set("payoutMethod", m)} className="accent-[#5433eb]" />
                  {payoutLabel(m)}
                </label>
              ))}
            </div>
            <div><label className="label" htmlFor="payoutAccount">{val("payoutMethod", "orange_money") === "bank" ? "IBAN / RIB" : "Numéro marchand ou de téléphone"}</label><input id="payoutAccount" required className="input font-mono" value={val("payoutAccount")} onChange={(e) => set("payoutAccount", e.target.value)} /></div>
            <label className="flex items-center gap-3 text-sm text-bone"><input type="checkbox" checked={val("cod", "1") === "1"} onChange={(e) => set("cod", e.target.checked ? "1" : "0")} className="accent-[#5433eb]" />J&apos;accepte le paiement à la livraison</label>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {plans.map((pl) => (
              <label key={pl.id} className={`flex cursor-pointer items-start justify-between gap-4 rounded-[18px] border px-4 py-3 ${val("plan") === pl.id ? "" : "border-line"}`}
                style={val("plan") === pl.id ? { borderColor: pl.color, background: `color-mix(in srgb, ${pl.color} 6%, transparent)` } : undefined}>
                <span className="flex items-start gap-3">
                  <input type="radio" name="plan" checked={val("plan") === pl.id} onChange={() => set("plan", pl.id)} className="mt-1 accent-[#5433eb]" />
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-medium" style={{ color: pl.color }}>{pl.name}{pl.highlighted && <span className="rounded-full bg-[#5433eb] px-2 py-0.5 text-[11px] text-[#ffffff]">Conseillé</span>}</span>
                    <span className="mt-0.5 block text-sm text-ash">{pl.pitch}</span>
                    <span className="mt-0.5 block text-xs text-iron">{pl.products}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right font-mono text-sm text-white">{pl.monthly.toLocaleString("fr-FR")}<span className="block text-[11px] text-iron">FCFA / mois</span></span>
              </label>
            ))}
            <p className="text-sm"><a href="/tarifs" target="_blank" rel="noopener" className="link">Comparer les forfaits en détail</a></p>
            <p className="text-xs text-iron">Rien à payer maintenant. Après l&apos;autorisation, vous contacterez l&apos;administrateur puis paierez votre forfait.</p>
          </div>
        )}

        <div className="flex justify-between gap-3 border-t border-line pt-5">
          <button type="button" className="btn" onClick={() => { setError(""); setStep(Math.max(0, step - 1)); }} disabled={step === 0}>Retour</button>
          <button type="submit" data-haptic className="btn-solid" disabled={pending}>{pending ? "Envoi…" : step === steps.length - 1 ? "Envoyer ma demande" : "Continuer →"}</button>
        </div>
        {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
        <p className="font-mono text-xs text-iron">brouillon enregistré automatiquement</p>
      </form>

      {/* Aperçu en direct : la fiche telle que les clients la verront */}
      <aside aria-label="Aperçu de votre boutique" className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-3 text-sm text-ash">Aperçu pour vos clients</p>
        <div className="hub-tile min-h-0 gap-5" style={{ ["--c" as string]: accent, ["--cl" as string]: type?.light ?? "#5433eb" }} data-shop-preview>
          <span className="hub-glow" aria-hidden="true" />
          <div className="flex items-center gap-4">
            <span className="hub-icon h-14 w-14" data-in=""><ShopTypeIcon slug={val("category")} size={40} /></span>
            <div className="min-w-0">
              <p className="truncate font-display text-2xl leading-tight text-white">{val("shopName") || "Nom de votre boutique"}</p>
              <p className="truncate text-xs text-ash">{type?.name ?? "Type de boutique"} · {[val("district"), val("city", p?.city ?? ""), val("country", p?.country ?? "")].filter(Boolean).join(", ") || "Ville, pays"}</p>
            </div>
          </div>
          {samples.some((s) => s.name.trim()) && (
            <ul className="space-y-1.5 text-sm">
              {samples.filter((s) => s.name.trim()).map((s, i) => (
                <li key={i} className="flex justify-between gap-3"><span className="truncate text-bone">{s.name}</span><span className="font-mono text-white">{Number(s.price.replace(/\D/g, "")) > 0 ? fcfa(Number(s.price.replace(/\D/g, ""))) : "…"}</span></li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="btn pointer-events-none px-3 py-1.5 text-xs">WhatsApp</span>
            <span className="btn pointer-events-none px-3 py-1.5 text-xs">Appeler</span>
            {physical && <span className="btn pointer-events-none px-3 py-1.5 text-xs">Voir sur la carte</span>}
          </div>
        </div>
      </aside>
    </div>
  );
}

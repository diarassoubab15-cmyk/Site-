"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { update, useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { supabaseBrowser } from "@/lib/supabase/client";
import { passwordLogin, signOut } from "@/app/actions";

export type AuthMode = "connexion" | "inscription";
type Step = "form" | "check-email" | "forgot" | "forgot-sent" | "link-sent";

/**
 * Se connecter / S'inscrire, par e-mail et mot de passe (fiable, sans attendre d'e-mail à chaque fois).
 * Secours : « Recevoir un lien de connexion » et « Mot de passe oublié » (lien par e-mail vers /auth/callback).
 */
export function LoginForm({ user, next = "/compte", initialMode = "connexion" }: { user?: { email: string; phone: string } | null; next?: string; initialMode?: AuthMode }) {
  const demo = useDemo();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const connected = supabaseEnabled ? user : demo.profile && (demo.profile.email || demo.profile.phone) ? demo.profile : null;
  if (connected) {
    return (
      <div className="card space-y-4">
        <p className="text-white">Connecté en tant que <span className="font-mono text-iris">{connected.email || connected.phone}</span></p>
        <div className="flex flex-wrap gap-2">
          <Link href="/compte" className="btn-solid">Mon compte</Link>
          <button className="btn" onClick={() => (supabaseEnabled ? start(async () => { await signOut(); router.refresh(); }) : update((s) => ({ ...s, profile: null })))}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const mail = email.trim().toLowerCase();
  const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;
  const go = () => window.location.assign(next);   // navigation complète : la page suivante repart avec la session
  const fail = (msg: string) => setError(msg);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "inscription" && name.trim().length < 2) return fail("Indiquez votre nom.");
    if (password.length < 8) return fail("Le mot de passe doit contenir au moins 8 caractères.");
    if (!supabaseEnabled) {
      update((s) => ({ ...s, profile: { name: name || s.profile?.name || "", city: "", country: "", email: mail, phone: "" } }));
      return;
    }
    start(async () => {
      const sb = supabaseBrowser();
      if (mode === "connexion") {
        const r = await passwordLogin({ email: mail, password });
        if (r.ok && r.mfa) return window.location.assign(`/connexion/verification?next=${encodeURIComponent(next)}`);
        if (r.ok) return go();
        setPassword("");
        return fail(r.error);
      }
      const { data, error } = await sb.auth.signUp({ email: mail, password, options: { data: { full_name: name.trim() }, emailRedirectTo: callback(next) } });
      if (error) {
        if (/registered|exists/i.test(error.message)) return fail("Un compte existe déjà avec cet e-mail : connectez-vous.");
        if (error.status === 429) return fail("Trop de demandes. Patientez une minute.");
        return fail(/password/i.test(error.message) ? "Mot de passe trop simple : mélangez lettres et chiffres." : "Inscription impossible. Vérifiez l'adresse e-mail.");
      }
      // Compte déjà existant : Supabase ne le dit pas (sécurité), mais ne renvoie aucune identité.
      if (data.user && data.user.identities?.length === 0) return fail("Un compte existe déjà avec cet e-mail : connectez-vous.");
      if (data.session) {
        await sb.from("profiles").update({ full_name: name.trim() }).eq("id", data.session.user.id);
        return go();
      }
      setStep("check-email");   // confirmation de l'adresse demandée par Supabase
    });
  }

  function magicLink() {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(mail)) return fail("Entrez d'abord votre adresse e-mail.");
    start(async () => {
      const { error } = await supabaseBrowser().auth.signInWithOtp({ email: mail, options: { emailRedirectTo: callback(next), shouldCreateUser: false } });
      if (error) return fail(error.status === 429 ? "Trop de demandes. Patientez une minute." : "Aucun compte avec cet e-mail : inscrivez-vous.");
      setStep("link-sent");
    });
  }

  function forgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(mail)) return fail("Entrez votre adresse e-mail.");
    start(async () => {
      const { error } = await supabaseBrowser().auth.resetPasswordForEmail(mail, { redirectTo: callback("/compte/mot-de-passe") });
      if (error) return fail(error.status === 429 ? "Trop de demandes. Patientez une minute." : "Envoi impossible. Vérifiez l'adresse.");
      setStep("forgot-sent");
    });
  }

  const mailNote = (
    <p className="text-xs text-iron">
      L&apos;e-mail vient de « Supabase Auth » : regardez aussi dans Spams et Promotions. Ouvrez le lien <strong className="text-white">dans le même navigateur</strong> (appui long sur le lien → « Ouvrir dans Chrome »).
    </p>
  );

  if (step === "check-email" || step === "link-sent" || step === "forgot-sent") {
    const text = step === "check-email"
      ? <>Dernière étape : nous avons envoyé un e-mail à <span className="font-mono text-iris">{mail}</span>. Touchez le lien qu&apos;il contient pour confirmer votre adresse ; votre compte sera alors ouvert.</>
      : step === "link-sent"
        ? <>Lien de connexion envoyé à <span className="font-mono text-iris">{mail}</span>. Touchez-le pour vous connecter.</>
        : <>E-mail envoyé à <span className="font-mono text-iris">{mail}</span>. Touchez le lien pour choisir un nouveau mot de passe.</>;
    return (
      <div className="card space-y-4" role="status">
        <p className="text-bone">{text}</p>
        {mailNote}
        <button type="button" className="btn" onClick={() => { setStep("form"); setError(""); }}>Retour</button>
      </div>
    );
  }

  if (step === "forgot") {
    return (
      <form onSubmit={forgot} className="card space-y-4">
        <h2 className="text-lg font-medium text-white">Mot de passe oublié</h2>
        <p className="text-sm text-ash">Recevez un lien pour choisir un nouveau mot de passe. Il sert aussi à créer un mot de passe si vous vous étiez inscrit sans.</p>
        <div>
          <label htmlFor="email" className="label">Adresse e-mail</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
        <button className="btn-solid w-full" disabled={pending}>{pending ? "Envoi…" : "Recevoir le lien"}</button>
        <button type="button" className="text-sm text-ash hover:text-white" onClick={() => { setStep("form"); setError(""); }}>Retour</button>
      </form>
    );
  }

  return (
    <div className="card space-y-6">
      <div className="auth-tabs" role="tablist" aria-label="Se connecter ou s'inscrire">
        {(["connexion", "inscription"] as AuthMode[]).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(""); }}>
            {m === "connexion" ? "Se connecter" : "S'inscrire"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "inscription" && (
          <div>
            <label htmlFor="name" className="label">Nom et prénom</label>
            <input id="name" required autoComplete="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">Adresse e-mail</label>
          <input id="email" type="email" required autoComplete="email" inputMode="email" placeholder="vous@exemple.com" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">Mot de passe</label>
            <button type="button" className="text-xs text-iris" onClick={() => setShowPw((v) => !v)}>{showPw ? "Masquer" : "Afficher"}</button>
          </div>
          <input id="password" type={showPw ? "text" : "password"} required minLength={8} autoComplete={mode === "connexion" ? "current-password" : "new-password"} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === "inscription"
            ? <p className="mt-1.5 text-xs text-iron">8 caractères au moins.</p>
            : <p className="mt-2 rounded-[14px] bg-[#fff6e5] px-3 py-2 text-xs text-[#8a5a00]">Attention : <strong>une seule erreur</strong> de mot de passe bloque cet appareil pour ce compte. Pas sûr ? Utilisez « Mot de passe oublié ».</p>}
        </div>
        {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
        <button className="btn-solid w-full" disabled={pending}>
          {pending ? "Un instant…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      {mode === "connexion" ? (
        <div className="flex flex-wrap justify-between gap-3 text-sm">
          <button type="button" className="text-iris underline underline-offset-4" onClick={() => { setStep("forgot"); setError(""); }}>Mot de passe oublié ?</button>
          {supabaseEnabled && <button type="button" className="text-ash underline underline-offset-4 hover:text-white" onClick={magicLink} disabled={pending}>Recevoir un lien de connexion</button>}
        </div>
      ) : (
        <p className="text-xs text-iron">En créant un compte, vous acceptez les <Link href="/conditions" className="link">conditions</Link> et la <Link href="/confidentialite" className="link">politique de confidentialité</Link>.</p>
      )}
    </div>
  );
}

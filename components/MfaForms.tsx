"use client";
import { useEffect, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const codeInput = (value: string, set: (v: string) => void) => (
  <input id="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input text-center font-mono text-2xl tracking-[0.5em]"
    value={value} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} aria-label="Code à 6 chiffres" />
);

/** Connexion, deuxième étape : le code à 6 chiffres de l'application d'authentification. */
export function MfaVerify({ next }: { next: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) return setError("Le code contient 6 chiffres.");
    start(async () => {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.mfa.listFactors();
      const factor = data?.totp?.[0];
      if (!factor) return setError("Aucune double vérification active sur ce compte.");
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
      if (error) { setCode(""); return setError("Code incorrect ou expiré. Prenez le nouveau code affiché dans l'application."); }
      window.location.assign(next);
    });
  }
  return (
    <form onSubmit={verify} className="card space-y-4">
      <p className="text-sm text-ash">Ouvrez votre application d&apos;authentification (Google Authenticator, Microsoft Authenticator…) et entrez le code NEXORA.</p>
      {codeInput(code, setCode)}
      {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
      <button className="btn-solid w-full" disabled={pending}>{pending ? "Vérification…" : "Valider"}</button>
      <button type="button" className="text-sm text-ash hover:text-white" onClick={async () => { await supabaseBrowser().auth.signOut(); window.location.assign("/connexion"); }}>Se déconnecter</button>
    </form>
  );
}

type Factor = { id: string; status: string; friendly_name?: string };

/** Activer / désactiver la double vérification (application d'authentification, code à 6 chiffres). */
export function MfaSetup({ required }: { required?: boolean }) {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function refresh() {
    const { data } = await supabaseBrowser().auth.mfa.listFactors();
    setFactors((data?.all ?? []) as Factor[]);
  }
  useEffect(() => { refresh(); }, []);
  const active = factors?.find((f) => f.status === "verified");

  function begin() {
    setError("");
    start(async () => {
      const sb = supabaseBrowser();
      // Une tentative d'activation abandonnée laisse un facteur « non vérifié » : on le retire d'abord.
      for (const f of factors ?? []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Téléphone ${new Date().toLocaleDateString("fr-FR")}` });
      if (error || !data) return setError("Activation impossible pour le moment. Réessayez dans un instant.");
      setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    });
  }
  function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setError("");
    if (!/^\d{6}$/.test(code)) return setError("Le code contient 6 chiffres.");
    start(async () => {
      const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId: enroll.id, code });
      if (error) { setCode(""); return setError("Code incorrect. Vérifiez l'heure de votre téléphone et prenez le code affiché."); }
      setEnroll(null); setCode("");
      toast("Double vérification activée", "ok");
      await refresh();
    });
  }
  function disable() {
    if (!active || !window.confirm("Désactiver la double vérification ? Votre compte sera moins protégé.")) return;
    start(async () => {
      const { error } = await supabaseBrowser().auth.mfa.unenroll({ factorId: active.id });
      if (error) return setError("Désactivation impossible : reconnectez-vous avec votre code puis réessayez.");
      toast("Double vérification désactivée", "ok");
      await refresh();
    });
  }

  if (!factors) return <div className="card skeleton h-40" aria-busy="true" />;

  if (active) {
    return (
      <div className="card space-y-4">
        <p className="flex items-center gap-2 text-white"><span className="h-2.5 w-2.5 rounded-full bg-pulse" aria-hidden="true" /> Double vérification <strong>activée</strong></p>
        <p className="text-sm text-ash">À chaque connexion, NEXORA vous demande le code de votre application. Même avec votre mot de passe, personne ne peut entrer sans votre téléphone.</p>
        {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
        <button type="button" className="btn-danger" onClick={disable} disabled={pending}>Désactiver</button>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      {required && <p className="rounded-[14px] bg-[#fff6e5] px-3 py-2 text-sm text-[#8a5a00]">Compte administrateur : activez la double vérification pour protéger tout le site.</p>}
      {!enroll ? (
        <>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ash">
            <li>Installez une application d&apos;authentification gratuite : <strong className="text-white">Google Authenticator</strong> ou <strong className="text-white">Microsoft Authenticator</strong>.</li>
            <li>Touchez « Activer » ci-dessous, puis scannez le QR code avec l&apos;application.</li>
            <li>Entrez le code à 6 chiffres affiché par l&apos;application.</li>
          </ol>
          {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
          <button type="button" className="btn-solid w-full" onClick={begin} disabled={pending}>{pending ? "Préparation…" : "Activer la double vérification"}</button>
        </>
      ) : (
        <form onSubmit={confirm} className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code généré par Supabase (image SVG) */}
            <img src={enroll.qr} alt="QR code à scanner avec l'application d'authentification" width={200} height={200} className="rounded-[20px] bg-[#fff] p-2 shadow-[var(--shadow-soft)]" />
            <p className="text-center text-xs text-iron">Impossible de scanner ? Dans l&apos;application, choisissez « Saisir une clé » et tapez :<br /><span className="select-all break-all font-mono text-sm text-white">{enroll.secret}</span></p>
          </div>
          <label htmlFor="code" className="label">Code affiché dans l&apos;application</label>
          {codeInput(code, setCode)}
          {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
          <button className="btn-solid w-full" disabled={pending}>{pending ? "Vérification…" : "Confirmer l'activation"}</button>
        </form>
      )}
    </div>
  );
}

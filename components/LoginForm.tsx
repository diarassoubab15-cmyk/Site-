"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { update, useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { supabaseBrowser } from "@/lib/supabase/client";
import { signOut } from "@/app/actions";

type Mode = "email" | "phone";

export function LoginForm({ user, next = "/compte" }: { user?: { email: string; phone: string } | null; next?: string }) {
  const demo = useDemo();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("email");
  const [id, setId] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const connected = supabaseEnabled ? user : demo.profile && (demo.profile.email || demo.profile.phone) ? demo.profile : null;

  if (connected) {
    return (
      <div className="card space-y-4">
        <p className="text-white">Connecté en tant que <span className="font-mono text-iris">{connected.email || connected.phone}</span></p>
        <div className="flex flex-wrap gap-2">
          <Link href="/compte" className="btn-solid">Mon compte</Link>
          <button
            className="btn"
            onClick={() => (supabaseEnabled ? start(async () => { await signOut(); router.refresh(); }) : update((s) => ({ ...s, profile: null })))}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const target = mode === "email" ? id.trim().toLowerCase() : id.replace(/[^\d+]/g, "");

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supabaseEnabled) return setSent(true);
    start(async () => {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithOtp(mode === "email" ? { email: target } : { phone: target });
      if (error) setError(error.status === 429 ? "Trop de demandes. Patientez une minute avant de redemander un code." : "Envoi impossible. Vérifiez l'adresse ou le numéro.");
      else setSent(true);
    });
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Le code contient 6 chiffres.");
    if (!supabaseEnabled) {
      update((s) => ({ ...s, profile: { name: s.profile?.name ?? "", city: s.profile?.city ?? "", country: s.profile?.country ?? "", email: mode === "email" ? id : s.profile?.email ?? "", phone: mode === "phone" ? id : s.profile?.phone ?? "" } }));
      return;
    }
    start(async () => {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.verifyOtp(mode === "email" ? { email: target, token: code, type: "email" } : { phone: target, token: code, type: "sms" });
      if (error) return setError("Code incorrect ou expiré.");
      router.push(next);
      router.refresh();
    });
  }

  function google() {
    if (!supabaseEnabled) {
      update((s) => ({ ...s, profile: { name: "Compte Google", email: "demo@gmail.com", phone: "", city: "", country: "" } }));
      return;
    }
    start(async () => {
      await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    });
  }

  return (
    <div className="card space-y-6">
      <div className="inline-flex rounded-[6px] border border-line p-1" role="tablist">
        {(["email", "phone"] as Mode[]).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setSent(false); setId(""); setError(""); }} className={`rounded-[4px] px-4 py-1.5 text-sm ${mode === m ? "bg-white text-black" : "text-ash hover:text-white"}`}>
            {m === "email" ? "E-mail" : "Téléphone"}
          </button>
        ))}
      </div>

      {!sent ? (
        <form onSubmit={send} className="space-y-4">
          <div>
            <label htmlFor="id" className="label">{mode === "email" ? "Adresse e-mail" : "Numéro de téléphone"}</label>
            <input id="id" required autoFocus type={mode === "email" ? "email" : "tel"} inputMode={mode === "email" ? "email" : "tel"} autoComplete={mode === "email" ? "email" : "tel"} placeholder={mode === "email" ? "vous@exemple.com" : "+225 07 00 00 00 00"} className="input" value={id} onChange={(e) => setId(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "id-err" : undefined} />
            {error && <p id="id-err" className="mt-1.5 text-xs text-alarm">{error}</p>}
          </div>
          <button className="btn-solid w-full" disabled={pending}>{pending ? "Envoi…" : "Recevoir un code"}</button>
          <p className="text-xs text-iron">Pas de mot de passe à retenir. Pas encore de compte ? Il est créé automatiquement.</p>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-sm text-ash">Code envoyé {mode === "email" ? "par e-mail" : "par SMS"} à <span className="font-mono text-iris">{id}</span>. Il expire dans 10 minutes.</p>
          <div>
            <label htmlFor="code" className="label">Code à 6 chiffres</label>
            <input id="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input font-mono tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={!!error} aria-describedby={error ? "code-err" : undefined} />
            {error && <p id="code-err" className="mt-1.5 text-xs text-alarm">{error}</p>}
          </div>
          <button className="btn-solid w-full" disabled={pending}>{pending ? "Vérification…" : "Se connecter"}</button>
          <button type="button" className="text-sm text-ash hover:text-white" onClick={() => { setSent(false); setCode(""); setError(""); }}>Modifier {mode === "email" ? "l'e-mail" : "le numéro"}</button>
        </form>
      )}

      <div className="flex items-center gap-4 text-xs text-iron"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>
      <button className="btn w-full" type="button" onClick={google} disabled={pending}>Continuer avec Google</button>
    </div>
  );
}

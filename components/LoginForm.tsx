"use client";
import Link from "next/link";
import { useState } from "react";
import { update, useDemo } from "@/lib/demo-store";

type Mode = "email" | "phone";

export function LoginForm() {
  const demo = useDemo();
  const [mode, setMode] = useState<Mode>("email");
  const [id, setId] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (demo.profile && (demo.profile.email || demo.profile.phone)) {
    return (
      <div className="card space-y-4">
        <p className="text-white">Connecté en tant que <span className="font-mono text-iris">{demo.profile.email || demo.profile.phone}</span></p>
        <div className="flex flex-wrap gap-2">
          <Link href="/compte" className="btn-solid">Mon compte</Link>
          <button className="btn" onClick={() => update((s) => ({ ...s, profile: null }))}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSent(true);
  }
  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Le code contient 6 chiffres.");
    update((s) => ({ ...s, profile: { name: s.profile?.name ?? "", city: s.profile?.city ?? "", country: s.profile?.country ?? "", email: mode === "email" ? id : s.profile?.email ?? "", phone: mode === "phone" ? id : s.profile?.phone ?? "" } }));
  }

  return (
    <div className="card space-y-6">
      <div className="inline-flex rounded-[6px] border border-line p-1" role="tablist">
        {(["email", "phone"] as Mode[]).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setSent(false); setId(""); }} className={`rounded-[4px] px-4 py-1.5 text-sm ${mode === m ? "bg-white text-black" : "text-ash hover:text-white"}`}>
            {m === "email" ? "E-mail" : "Téléphone"}
          </button>
        ))}
      </div>

      {!sent ? (
        <form onSubmit={send} className="space-y-4">
          <div>
            <label htmlFor="id" className="label">{mode === "email" ? "Adresse e-mail" : "Numéro de téléphone"}</label>
            <input id="id" required autoFocus type={mode === "email" ? "email" : "tel"} inputMode={mode === "email" ? "email" : "tel"} autoComplete={mode === "email" ? "email" : "tel"} placeholder={mode === "email" ? "vous@exemple.com" : "+225 07 00 00 00 00"} className="input" value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <button className="btn-solid w-full">Recevoir un code</button>
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
          <button className="btn-solid w-full">Se connecter</button>
          <button type="button" className="text-sm text-ash hover:text-white" onClick={() => setSent(false)}>Modifier {mode === "email" ? "l'e-mail" : "le numéro"}</button>
        </form>
      )}

      <div className="flex items-center gap-4 text-xs text-iron"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>
      <button className="btn w-full" type="button" onClick={() => update((s) => ({ ...s, profile: { name: "Compte Google", email: "demo@gmail.com", phone: "", city: "", country: "" } }))}>
        Continuer avec Google
      </button>
    </div>
  );
}

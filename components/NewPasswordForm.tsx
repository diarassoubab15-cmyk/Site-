"use client";
import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

export function NewPasswordForm() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 8) return setError("8 caractères au moins.");
    if (pw !== pw2) return setError("Les deux mots de passe sont différents.");
    start(async () => {
      const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
      if (error) return setError(/same/i.test(error.message) ? "Choisissez un mot de passe différent de l'ancien." : "Enregistrement impossible. Redemandez un lien « Mot de passe oublié ».");
      toast("Mot de passe enregistré", "ok");
      window.location.assign("/compte");
    });
  }
  return (
    <form onSubmit={save} className="card space-y-4">
      <div>
        <label htmlFor="pw" className="label">Nouveau mot de passe</label>
        <input id="pw" type="password" required minLength={8} autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      <div>
        <label htmlFor="pw2" className="label">Confirmez le mot de passe</label>
        <input id="pw2" type="password" required minLength={8} autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
      {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
      <button className="btn-solid w-full" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}

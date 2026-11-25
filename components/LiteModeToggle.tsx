"use client";
import { useEffect, useState } from "react";

type Choice = "auto" | "on" | "off";
const KEY = "nx-lite";

/**
 * « Économie de données » : Automatique (selon le téléphone et la connexion), Toujours, ou Jamais.
 * Le choix reste sur l'appareil ; le site l'applique dès le chargement de chaque page (lib/motion-script.ts).
 */
export function LiteModeToggle() {
  const [choice, setChoice] = useState<Choice>("auto");
  const [active, setActive] = useState(false);
  useEffect(() => {
    try { const v = localStorage.getItem(KEY); setChoice(v === "1" ? "on" : v === "0" ? "off" : "auto"); } catch { /* stockage indisponible */ }
    setActive(document.documentElement.hasAttribute("data-lite"));
  }, []);

  function pick(c: Choice) {
    setChoice(c);
    try {
      if (c === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, c === "on" ? "1" : "0");
    } catch { /* idem */ }
    // Rechargement : la détection automatique se refait proprement, avant l'affichage.
    window.location.reload();
  }

  const options: [Choice, string, string][] = [
    ["auto", "Automatique", "activée sur connexion lente ou petit téléphone"],
    ["on", "Toujours", "le site le plus léger possible"],
    ["off", "Jamais", "toutes les animations"],
  ];
  return (
    <section className="card space-y-4" aria-labelledby="leger">
      <div>
        <h2 id="leger" className="text-xl font-medium text-white">Économie de données</h2>
        <p className="mt-1 text-sm text-ash">
          Coupe les animations, les particules et la lecture automatique des vidéos : les pages s&apos;affichent plus vite et consomment moins de forfait internet.
          {" "}<span className="text-bone">En ce moment : {active ? "activée" : "désactivée"}.</span>
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Économie de données">
        {options.map(([c, label, help]) => (
          <button key={c} type="button" role="radio" aria-checked={choice === c} onClick={() => pick(c)}
            className={`rounded-[18px] border px-4 py-3 text-left text-sm ${choice === c ? "border-white text-white" : "border-line text-bone hover:border-iron"}`}>
            <span className="block font-medium">{label}</span>
            <span className="block text-xs text-iron">{help}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Version courte pour le pied de page (accessible sans compte). */
export function LiteModeLink() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => setOn(document.documentElement.hasAttribute("data-lite")), []);
  if (on === null) return null;
  return (
    <button type="button" className="hover:text-white" onClick={() => { try { localStorage.setItem(KEY, on ? "0" : "1"); } catch { /* stockage indisponible */ } window.location.reload(); }}>
      Économie de données : {on ? "activée" : "désactivée"}
    </button>
  );
}

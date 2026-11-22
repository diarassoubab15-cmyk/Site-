"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { createAiCreation, pollAiCreation, publishAiCreation, type AiCreationView } from "@/app/actions";

/** Idées de départ, pour écrire comme on parle : l'IA s'occupe du reste. */
const IDEAS = [
  "Ma boutique de bazin à Bamako, en fin d'après-midi, lumière dorée sur les tissus",
  "Une paire de sandales en cuir posée sur un tissu bogolan, vue de près",
  "Une villa blanche à Bamako, lumière du soleil du matin, jardin avec manguier",
  "Des pots de beurre de karité sur une table en bois, au marché",
];

type State = { ready: boolean; remaining: { image: number; video: number }; creations: AiCreationView[] };

/**
 * Studio IA (forfait Ultra) : le vendeur décrit une image ou une vidéo, l'IA la crée,
 * il choisit ensuite ce qu'il publie sur sa boutique. Rendu photo réaliste (lumière naturelle, sans texte incrusté).
 */
export function AiStudio({ ultra, initial }: { ultra: boolean; initial: State | null }) {
  const [state, setState] = useState<State | null>(initial);
  const [kind, setKind] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const images = (state?.creations ?? []).filter((c) => c.kind === "image" && c.status === "done");
  const waiting = (state?.creations ?? []).filter((c) => c.status === "pending").map((c) => c.id).join(",");

  // Suivi des créations en cours, toutes les 4 secondes.
  useEffect(() => {
    if (!waiting) return;
    timer.current = setTimeout(async () => {
      const updates = await Promise.all(waiting.split(",").map((id) => pollAiCreation({ id })));
      setState((s) => s && {
        ...s,
        creations: s.creations.map((c) => {
          const u = updates.find((r) => r.ok && r.data?.id === c.id);
          return u?.ok && u.data ? u.data : c;
        }),
      });
      for (const u of updates) {
        if (u.ok && u.data?.status === "done") toast(u.data.kind === "video" ? "Votre vidéo est prête" : "Votre image est prête", "ok");
        if (u.ok && u.data?.status === "failed") toast("Une création n'a pas abouti : elle ne compte pas, réessayez.", "error");
      }
    }, 4000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [waiting, state]);

  if (!ultra) {
    return (
      <section className="card studio-card" aria-labelledby="studio-titre">
        <h2 id="studio-titre" className="text-lg font-medium text-white">Studio IA <span className="badge ml-2 border-[#e3b341]/50 text-[#e3b341]">Ultra</span></h2>
        <p className="mt-3 max-w-xl text-sm text-ash">
          Décrivez en quelques mots l&apos;image ou la vidéo que vous voulez : l&apos;IA la crée pour votre boutique, avec un rendu de vraie photo.
          30 images et 4 vidéos par mois, incluses dans le forfait <strong className="text-white">Ultra</strong>.
        </p>
        <Link href="/tarifs" className="btn mt-5">Voir le forfait Ultra</Link>
      </section>
    );
  }
  if (!state) return null;

  function create() {
    start(async () => {
      const r = await createAiCreation({ kind, prompt, sourceId: kind === "video" ? source : null });
      if (!r.ok) { toast(r.error ?? "Erreur", "error"); return; }
      const now: AiCreationView = { id: r.data!.id, kind, prompt, status: "pending", url: null, published: false, createdAt: new Date().toISOString() };
      setState((s) => s && { ...s, creations: [now, ...s.creations], remaining: { ...s.remaining, [kind]: Math.max(0, s.remaining[kind] - 1) } });
      setPrompt("");
      toast("Création lancée : comptez 30 secondes à 2 minutes.", "ok");
    });
  }

  function publish(c: AiCreationView) {
    start(async () => {
      const r = await publishAiCreation({ id: c.id, published: !c.published });
      if (!r.ok) { toast(r.error ?? "Erreur", "error"); return; }
      setState((s) => s && { ...s, creations: s.creations.map((x) => (x.id === c.id ? { ...x, published: !c.published } : x)) });
      toast(c.published ? "Retirée de votre boutique" : "Publiée sur votre boutique", "ok");
    });
  }

  const left = state.remaining[kind];
  const canCreate = state.ready && left > 0 && prompt.trim().length >= 3 && (kind === "image" || !!source) && !pending;

  return (
    <section className="card studio-card space-y-6" aria-labelledby="studio-titre">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="studio-titre" className="text-lg font-medium text-white">Studio IA <span className="badge ml-2 border-[#e3b341]/50 text-[#e3b341]">Ultra</span></h2>
        <p className="font-mono text-xs text-iron">ce mois-ci : {state.remaining.image} image{state.remaining.image > 1 ? "s" : ""} · {state.remaining.video} vidéo{state.remaining.video > 1 ? "s" : ""}</p>
      </div>
      {!state.ready && <p className="rounded-[10px] border border-line p-3 text-sm text-ash">Le Studio IA arrive très bientôt. Vous pouvez déjà préparer vos idées : rien ne sera décompté avant l&apos;ouverture.</p>}

      <div role="radiogroup" aria-label="Que voulez-vous créer ?" className="flex gap-2">
        {(["image", "video"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`pill ${kind === k ? "border-[#e3b341] text-white" : ""}`}>
            {k === "image" ? "Une image" : "Une vidéo"}
          </button>
        ))}
      </div>

      {kind === "video" && (
        <fieldset>
          <legend className="label">Image à animer</legend>
          {images.length === 0 ? (
            <p className="mt-2 text-sm text-ash">Créez d&apos;abord une image : la vidéo la met en mouvement (5 secondes).</p>
          ) : (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {images.map((c) => (
                <button key={c.id} type="button" aria-pressed={source === c.id} aria-label={`Animer : ${c.prompt}`} onClick={() => setSource(c.id)}
                  className={`studio-pick ${source === c.id ? "is-on" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.url!} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </fieldset>
      )}

      <label className="block">
        <span className="label">{kind === "image" ? "Décrivez l'image, comme vous la voyez" : "Décrivez le mouvement (ex. : la caméra s'approche lentement)"}</span>
        <textarea className="input mt-1" rows={3} maxLength={600} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={IDEAS[0]} />
      </label>
      {kind === "image" && (
        <div className="flex flex-wrap gap-2" aria-label="Idées">
          {IDEAS.slice(1).map((i) => <button key={i} type="button" className="pill text-xs" onClick={() => setPrompt(i)}>{i}</button>)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-solid" disabled={!canCreate} onClick={create}>{pending ? "Envoi…" : kind === "image" ? "Créer l'image" : "Créer la vidéo"}</button>
        <p className="text-xs text-iron">Rendu de vraie photo : lumière naturelle, sans texte ajouté. Une création ratée ne compte pas.</p>
      </div>

      {state.creations.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Vos créations">
          {state.creations.map((c) => (
            <li key={c.id} className="studio-item">
              <div className="studio-media">
                {c.status === "pending" && <div className="skeleton h-full w-full" role="status" aria-label="Création en cours" />}
                {c.status === "failed" && <p className="flex h-full items-center justify-center p-3 text-center text-xs text-alarm">Non abouti (non décompté)</p>}
                {c.status === "done" && c.url && (c.kind === "video"
                  ? <video src={c.url} muted loop playsInline autoPlay className="h-full w-full object-cover" aria-label={c.prompt} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={c.url} alt={c.prompt} loading="lazy" className="h-full w-full object-cover" />)}
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ash">{c.prompt}</p>
              {c.status === "done" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button type="button" className={`pill px-2.5 py-1 text-xs ${c.published ? "border-pulse text-pulse" : ""}`} aria-pressed={c.published} onClick={() => publish(c)} disabled={pending}>
                    {c.published ? "✓ Publiée" : "Publier"}
                  </button>
                  <a href={c.url!} download className="pill px-2.5 py-1 text-xs">Télécharger</a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

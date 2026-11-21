"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { LiveSeller, VideoView } from "@/lib/views";
import { cancelShopVideo, requestShopVideo } from "@/app/actions";
import { VideoPlayer } from "./VideoPlayer";

const STATUS: Record<VideoView["status"], [string, string]> = {
  queued: ["bg-sky", "En file d'attente"],
  rendering: ["bg-amber", "En fabrication (1 à 2 min)"],
  review: ["bg-iris-glow", "Prête : en attente de validation par l'administrateur"],
  approved: ["bg-pulse", "Publiée sur votre boutique"],
  rejected: ["bg-alarm", "Refusée"],
  failed: ["bg-alarm", "Échec de fabrication (non décomptée)"],
  cancelled: ["bg-iron", "Annulée"],
};

/** Vidéo de la boutique : le vendeur décrit son activité, la vidéo est fabriquée puis validée par l'admin. */
export function SellerVideos({ live, online }: { live?: LiveSeller | null; online: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [description, setDescription] = useState("");
  const videos = live?.videos ?? [];
  const quota = live?.videoQuota ?? { used: 0, limit: 0 };
  const inProgress = videos.some((v) => v.status === "queued" || v.status === "rendering");

  // Pendant la fabrication, la page se met à jour seule (toutes les 15 s, onglet visible).
  useEffect(() => {
    if (!inProgress) return;
    const t = setInterval(() => !document.hidden && router.refresh(), 15000);
    return () => clearInterval(t);
  }, [inProgress, router]);

  if (!supabaseEnabled) {
    return (
      <section className="card" aria-labelledby="vid">
        <h2 id="vid" className="text-xl font-medium text-white">Vidéo de ma boutique</h2>
        <p className="mt-3 text-sm text-ash">Décrivez votre activité : une vidéo animée de 12 secondes est fabriquée pour votre boutique. Disponible une fois Supabase et le programme de fabrication branchés (mode démo actuellement).</p>
      </section>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await requestShopVideo({ description });
      if (!r.ok) return toast(r.error, "error");
      toast(`Demande ${r.data} envoyée : fabrication en cours`);
      setDescription("");
      router.refresh();
    });
  }

  const canRequest = online && !inProgress && quota.used < quota.limit;

  return (
    <section className="card space-y-6" aria-labelledby="vid">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="vid" className="text-xl font-medium text-white">Vidéo de ma boutique</h2>
        <p className="font-mono text-xs text-iron">{quota.used}/{quota.limit} ce mois-ci</p>
      </div>
      <p className="text-sm text-ash">
        Décrivez votre activité en quelques phrases : ce que vous vendez, pour qui, ce qui vous distingue. Une vidéo animée de 12 secondes est fabriquée,
        puis vérifiée par l&apos;administrateur avant d&apos;apparaître sur votre boutique.
      </p>

      {!online && <p className="text-sm text-amber">Votre boutique doit être en ligne (abonnement à jour) pour créer une vidéo.</p>}
      {online && (
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="vdesc" className="label">Description</label>
          <textarea id="vdesc" rows={4} minLength={20} maxLength={1500} required disabled={!canRequest || pending} className="input" placeholder="Ex. Agence immobilière à Bamako : villas, terrains et appartements. Visites accompagnées et titres fonciers vérifiés." value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs text-iron">{description.length}/1500</span>
            <button className="btn-solid" data-haptic disabled={!canRequest || pending || description.trim().length < 20}>
              {pending ? "Envoi…" : "Créer ma vidéo"}
            </button>
          </div>
          {inProgress && <p className="text-xs text-iron">Une vidéo est déjà en fabrication.</p>}
          {!inProgress && quota.used >= quota.limit && <p className="text-xs text-iron">Quota du mois atteint. Passez à un forfait supérieur pour plus de vidéos.</p>}
        </form>
      )}

      {videos.length > 0 && (
        <ul className="space-y-4" data-reveal suppressHydrationWarning>
          {videos.map((v) => {
            const [dot, label] = STATUS[v.status];
            return (
              <li key={v.id} className="rounded-[6px] border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm text-bone"><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</p>
                  <span className="font-mono text-xs text-iris">{v.ref}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-ash">{v.description}</p>
                {v.adminNote && v.status === "rejected" && <p className="mt-2 text-xs text-alarm">Motif : {v.adminNote}</p>}
                {v.videoUrl && v.posterUrl && (v.status === "review" || v.status === "approved") && (
                  <VideoPlayer src={v.videoUrl} poster={v.posterUrl} label={`Vidéo ${v.ref}`} className="mt-3 max-w-xl" />
                )}
                {v.status === "queued" && (
                  <button className="mt-2 text-xs text-ash hover:text-white" disabled={pending} onClick={() => start(async () => { const r = await cancelShopVideo({ id: v.id }); toast(r.ok ? "Demande annulée" : r.error ?? "Erreur", r.ok ? "ok" : "error"); router.refresh(); })}>
                    Annuler
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

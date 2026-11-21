"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "@/lib/toast";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { VideoView } from "@/lib/views";
import { adminReviewVideo, adminUnpublishVideo } from "@/app/actions";
import { VideoPlayer } from "./VideoPlayer";

/** Validation des vidéos de boutique : rien n'est publié sans l'accord de l'administrateur. */
export function AdminVideos({ live }: { live?: VideoView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!supabaseEnabled) return null;
  const videos = live ?? [];
  const review = videos.filter((v) => v.status === "review");
  const working = videos.filter((v) => v.status === "queued" || v.status === "rendering");
  const published = videos.filter((v) => v.status === "approved" && v.isActive);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      toast(r.ok ? msg : r.error ?? "Erreur", r.ok ? "ok" : "error");
      router.refresh();
    });

  return (
    <section className="card space-y-6" aria-labelledby="videos-admin">
      <div>
        <h2 id="videos-admin" className="text-xl font-medium text-white">Vidéos de boutique</h2>
        <p className="mt-2 text-sm text-ash">
          Fabriquées à partir de la description du vendeur. Vérifiez le contenu (rien de trompeur ni de choquant) avant de publier.
          {working.length > 0 && ` ${working.length} en fabrication.`}
        </p>
      </div>
      {review.length === 0 && <p className="text-sm text-iron">Aucune vidéo à valider.</p>}
      <ul className="space-y-6">
        {review.map((v) => (
          <li key={v.id} className="grid gap-4 rounded-[6px] border border-iris/40 p-4 lg:grid-cols-[1.2fr_1fr]">
            {v.videoUrl && v.posterUrl && <VideoPlayer src={v.videoUrl} poster={v.posterUrl} label={`Vidéo ${v.ref} de ${v.shopName}`} />}
            <div className="space-y-3 text-sm">
              <p className="text-white">{v.shopName} <span className="font-mono text-xs text-iris">{v.ref}</span></p>
              <p className="text-ash"><span className="text-bone">Description du vendeur :</span> {v.description}</p>
              <p className="font-mono text-xs text-iron">scénario {v.scriptSource === "ia" ? "rédigé par l'IA" : "simple (sans IA)"}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button className="btn-solid px-3 py-1.5 text-xs" data-haptic disabled={pending} onClick={() => act(() => adminReviewVideo({ id: v.id, approve: true }), "Vidéo publiée sur la boutique")}>Publier</button>
                <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => { const note = window.prompt("Motif du refus (visible par le vendeur) :", "Contenu à revoir"); if (note !== null) act(() => adminReviewVideo({ id: v.id, approve: false, note }), "Vidéo refusée"); }}>Refuser</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {published.length > 0 && (
        <div className="border-t border-line pt-6">
          <h3 className="mb-3 font-medium text-white">Publiées ({published.length})</h3>
          <ul className="divide-y divide-line text-sm">
            {published.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-bone">{v.shopName} <span className="font-mono text-xs text-iris">{v.ref}</span>{v.headline ? <span className="text-ash"> · {v.headline}</span> : null}</span>
                <button className="text-xs text-alarm hover:underline" disabled={pending} onClick={() => { const note = window.prompt("Motif du retrait :", "Retirée par l'administrateur"); if (note !== null) act(() => adminUnpublishVideo({ id: v.id, note }), "Vidéo retirée"); }}>Retirer</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

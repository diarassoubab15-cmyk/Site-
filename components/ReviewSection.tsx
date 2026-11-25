"use client";
import { PhotoPicker } from "./PhotoPicker";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Stars } from "./Stars";
import { today, uid, update, useDemo } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { refreshBuyerContext, useBuyerContext } from "@/lib/use-buyer-context";
import { addReview } from "@/app/actions";
import { SuccessCheck } from "./SuccessCheck";

export function ReviewSection({ product }: { product: string }) {
  const demo = useDemo();
  const router = useRouter();
  const liveOrder = useBuyerContext(product).reviewableOrderId;
  const [pending, start] = useTransition();
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const mine = supabaseEnabled ? [] : demo.reviews.filter((r) => r.product === product);
  // Avis 100 % vérifiés : seuls les acheteurs ayant reçu le produit peuvent noter.
  const canReview = supabaseEnabled ? !!liveOrder && !published : demo.orders.some((o) => o.product === product && o.status === "livrée");
  const already = !supabaseEnabled && mine.some((r) => r.author === demo.profile?.name);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supabaseEnabled) {
      update((s) => ({ ...s, reviews: [{ id: uid("R"), product, author: s.profile?.name ?? "Client", rating, title: title.trim(), body: body.trim(), date: today() }, ...s.reviews] }));
      setTitle("");
      setBody("");
      return;
    }
    start(async () => {
      const res = await addReview({ orderId: liveOrder, rating, title, body, photos });
      if (!res.ok) return setError(res.error);
      setPublished(true);
      refreshBuyerContext(product);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {mine.map((r) => (
        <article key={r.id} className="card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Stars value={r.rating} />
            <h3 className="font-medium text-white">{r.title}</h3>
            <span className="badge text-pulse">achat vérifié</span>
          </div>
          <p className="mt-3 text-bone">{r.body}</p>
          <p className="mt-3 text-xs text-iron">{r.author} · à l&apos;instant</p>
        </article>
      ))}
      {published && <p className="pop flex items-center gap-3 rounded-[6px] border border-pulse/40 px-4 py-3 text-sm text-pulse" role="status"><SuccessCheck size={22} />Merci ! Votre avis est publié.</p>}
      {canReview && !already ? (
        <form onSubmit={submit} className="card space-y-4 p-6">
          <p className="font-medium text-white">Donnez votre avis</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Note">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-amber" : "text-charcoal"}`}>★</button>
            ))}
          </div>
          <input required minLength={2} maxLength={80} placeholder="Titre" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea required minLength={5} maxLength={1000} rows={4} placeholder="Qu'avez-vous pensé du produit et du vendeur ?" className="input" value={body} onChange={(e) => setBody(e.target.value)} />
          {supabaseEnabled && <PhotoPicker bucket="review-photos" label="Photos du produit reçu" value={photos} onChange={setPhotos} />}
          {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
          <button className="btn" data-haptic disabled={pending}>{pending ? "Publication…" : "Publier l'avis"}</button>
        </form>
      ) : (
        !already && !published && (
          <p className="rounded-[6px] border border-line px-4 py-3 text-sm text-ash">
            Seuls les clients ayant reçu ce produit peuvent laisser un avis. Aucun faux avis possible.
          </p>
        )
      )}
    </div>
  );
}

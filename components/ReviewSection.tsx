"use client";
import { useState } from "react";
import { Stars } from "./Stars";
import { today, uid, update, useDemo } from "@/lib/demo-store";

export function ReviewSection({ product }: { product: string }) {
  const demo = useDemo();
  const mine = demo.reviews.filter((r) => r.product === product);
  // Avis 100 % vérifiés : seuls les acheteurs ayant reçu le produit peuvent noter.
  const canReview = demo.orders.some((o) => o.product === product && o.status === "livrée");
  const already = mine.some((r) => r.author === demo.profile?.name);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    update((s) => ({ ...s, reviews: [{ id: uid("R"), product, author: s.profile?.name ?? "Client", rating, title: title.trim(), body: body.trim(), date: today() }, ...s.reviews] }));
    setTitle("");
    setBody("");
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
      {canReview && !already ? (
        <form onSubmit={submit} className="card space-y-4 p-6">
          <p className="font-medium text-white">Donnez votre avis</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Note">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-amber" : "text-charcoal"}`}>★</button>
            ))}
          </div>
          <input required maxLength={80} placeholder="Titre" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea required maxLength={1000} rows={4} placeholder="Qu'avez-vous pensé du produit et du vendeur ?" className="input" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn">Publier l&apos;avis</button>
        </form>
      ) : (
        !already && (
          <p className="rounded-[6px] border border-line px-4 py-3 text-sm text-ash">
            Seuls les clients ayant reçu ce produit peuvent laisser un avis. Aucun faux avis possible.
          </p>
        )
      )}
    </div>
  );
}

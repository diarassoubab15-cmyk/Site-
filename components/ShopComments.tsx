"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { addShopComment, deleteShopComment, getShopComments, hideShopComment, replyShopComment, type ShopCommentView } from "@/app/actions";
import { supabaseEnabled } from "@/lib/supabase/env";
import { toast } from "@/lib/toast";
import { Stars } from "./Stars";

type Viewer = { loggedIn: boolean; isOwner: boolean; isAdmin: boolean };

/**
 * Commentaires sur la boutique : tout client connecté peut en laisser (avec une note facultative),
 * le vendeur répond, l'administrateur masque un commentaire abusif. Lus en direct à chaque visite.
 */
export function ShopComments({ slug, shopName }: { slug: string; shopName: string }) {
  const [list, setList] = useState<ShopCommentView[] | null>(null);
  const [viewer, setViewer] = useState<Viewer>({ loggedIn: !supabaseEnabled, isOwner: false, isAdmin: false });
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();

  const load = useCallback(() => {
    if (!supabaseEnabled) return setList((l) => l ?? []);
    getShopComments(slug).then((r) => { setList(r.comments); setViewer(r.viewer); }).catch(() => setList([]));
  }, [slug]);
  useEffect(load, [load]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 3) return toast("Écrivez au moins quelques mots.", "error");
    if (!supabaseEnabled) {
      setList((l) => [{ id: crypto.randomUUID(), author: "Vous", body: body.trim(), rating, reply: null, hidden: false, date: new Date().toISOString().slice(0, 10), mine: true }, ...(l ?? [])]);
      setBody(""); setRating(null);
      return toast("Merci pour votre commentaire", "ok");
    }
    start(async () => {
      const r = await addShopComment({ slug, body, rating });
      if (!r.ok) return toast(r.error ?? "Erreur", "error");
      setBody(""); setRating(null);
      toast("Merci pour votre commentaire", "ok");
      load();
    });
  }
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => { const r = await fn(); if (!r.ok) return toast(r.error ?? "Erreur", "error"); toast(ok, "ok"); setReplying(null); load(); });

  const visible = (list ?? []).filter((c) => !c.hidden || viewer.isAdmin || viewer.isOwner);
  const rated = visible.filter((c) => c.rating && !c.hidden);
  const avg = rated.length ? Math.round((rated.reduce((s, c) => s + c.rating!, 0) / rated.length) * 10) / 10 : 0;

  return (
    <section className="mt-16" aria-labelledby="commentaires">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="commentaires" className="text-2xl font-medium text-white">Commentaires <span className="font-mono text-sm text-iron">({visible.filter((c) => !c.hidden).length})</span></h2>
        {rated.length > 0 && <p className="flex items-center gap-2 text-sm text-ash"><Stars value={avg} /> {avg}/5 · {rated.length} note{rated.length > 1 ? "s" : ""}</p>}
      </div>

      {!viewer.isOwner && (viewer.loggedIn ? (
        <form onSubmit={send} className="card mt-6 space-y-3">
          <label htmlFor="comment" className="label">Votre avis sur {shopName}</label>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Note (facultative)">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`} onClick={() => setRating(rating === n ? null : n)}
                className={`text-2xl leading-none transition-transform active:scale-90 ${rating && n <= rating ? "text-[#f5a524]" : "text-[#d6d6dc]"}`}>★</button>
            ))}
            <span className="ml-2 text-xs text-iron">note facultative</span>
          </div>
          <textarea id="comment" rows={3} maxLength={800} className="input" placeholder="Accueil, qualité, livraison, prix…" value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-iron">Restez courtois : les commentaires abusifs sont retirés. Un problème grave ? <Link href={`/support?boutique=${slug}#signaler`} className="link">Signalez la boutique</Link>.</span>
            <button className="btn-solid shrink-0" disabled={pending}>{pending ? "Envoi…" : "Publier"}</button>
          </div>
        </form>
      ) : (
        <p className="card mt-6 text-sm text-ash"><Link href={`/connexion?next=/boutiques/${slug}`} className="link">Connectez-vous</Link> pour laisser un commentaire sur cette boutique.</p>
      ))}

      {list === null ? (
        <p className="mt-6 text-sm text-iron">Chargement des commentaires…</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-ash">Aucun commentaire pour l&apos;instant. Soyez le premier à donner votre avis.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((c) => (
            <li key={c.id} className={`card p-5 ${c.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{c.author} {c.rating && <span className="ml-2 align-middle"><Stars value={c.rating} /></span>}</p>
                <p className="font-mono text-xs text-iron">{new Date(c.date).toLocaleDateString("fr-FR")}{c.hidden && " · masqué"}</p>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-bone">{c.body}</p>
              {c.reply && (
                <div className="mt-3 rounded-[14px] bg-lift p-3 text-sm">
                  <p className="text-xs font-medium text-iris">Réponse de {shopName}</p>
                  <p className="mt-1 whitespace-pre-line text-bone">{c.reply}</p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {viewer.isOwner && replying !== c.id && <button type="button" className="text-iris underline underline-offset-4" onClick={() => { setReplying(c.id); setReply(c.reply ?? ""); }}>{c.reply ? "Modifier ma réponse" : "Répondre"}</button>}
                {c.mine && <button type="button" className="text-ash underline underline-offset-4" disabled={pending} onClick={() => run(() => deleteShopComment({ id: c.id }), "Commentaire supprimé")}>Supprimer</button>}
                {viewer.isAdmin && <button type="button" className="text-alarm underline underline-offset-4" disabled={pending} onClick={() => run(() => hideShopComment({ id: c.id, hidden: !c.hidden }), c.hidden ? "Commentaire réaffiché" : "Commentaire masqué")}>{c.hidden ? "Réafficher" : "Masquer"}</button>}
              </div>
              {replying === c.id && (
                <div className="mt-3 space-y-2">
                  <textarea rows={2} maxLength={800} className="input" aria-label="Votre réponse" value={reply} onChange={(e) => setReply(e.target.value)} />
                  <div className="flex gap-2">
                    <button type="button" className="btn-solid px-4 py-2 text-sm" disabled={pending} onClick={() => run(() => replyShopComment({ id: c.id, reply }), "Réponse publiée")}>Publier la réponse</button>
                    <button type="button" className="btn px-4 py-2 text-sm" onClick={() => setReplying(null)}>Annuler</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

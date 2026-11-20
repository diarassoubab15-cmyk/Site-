"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { today, uid, update, useDemo, type Ticket } from "@/lib/demo-store";
import { site } from "@/lib/site";
import { supabaseEnabled } from "@/lib/supabase/env";
import { createTicket } from "@/app/actions";
import type { KnownUser } from "@/lib/server-data";
import { SuccessCheck } from "./SuccessCheck";

const kinds: { id: Ticket["kind"]; label: string; anchor: string }[] = [
  { id: "contact", label: "Poser une question", anchor: "contact" },
  { id: "signalement", label: "Signaler un vendeur", anchor: "signaler" },
  { id: "remboursement", label: "Produit non reçu / remboursement", anchor: "remboursement" },
];

export function SupportForm({ shop, known: liveKnown }: { shop?: string; known?: KnownUser | null }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [kind, setKind] = useState<Ticket["kind"]>(shop ? "signalement" : "contact");
  // Ouvre directement le bon motif depuis un lien (#signaler, #remboursement).
  useEffect(() => {
    const sync = () => {
      const k = kinds.find((x) => x.anchor === window.location.hash.slice(1));
      if (k) setKind(k.id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const [contact, setContact] = useState({ name: "", email: "" });
  const [orderId, setOrderId] = useState("");
  const [shopName, setShopName] = useState(shop ?? "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  // Déjà identifié : on ne redemande ni nom ni e-mail.
  const known = supabaseEnabled ? !!liveKnown : !!demo.profile;
  const contactLabel = supabaseEnabled ? liveKnown?.email || liveKnown?.phone || liveKnown?.name : demo.profile?.email || demo.profile?.phone || demo.profile?.name;
  const orders = supabaseEnabled ? (liveKnown?.orders ?? []).map((o) => ({ id: o.uuid, label: `${o.ref} · ${o.productName} · ${o.shop}` })) : demo.orders.map((o) => ({ id: o.id, label: `${o.id} · ${o.productName} · ${o.shop}` }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (supabaseEnabled) {
      if (kind !== "contact" && !known) return router.push(`/connexion?next=${encodeURIComponent("/support#" + kinds.find((k) => k.id === kind)!.anchor)}`);
      const isUuid = /^[0-9a-f-]{36}$/.test(orderId);
      start(async () => {
        const res = await createTicket({ kind, message, orderId: isUuid ? orderId : undefined, shopSlug: shop, contact: known ? undefined : contact });
        if (res.ok) { setSent(res.data ?? ""); setMessage(""); }
        else if (res.login) router.push("/connexion?next=/support");
        else setError(res.error);
      });
      return;
    }
    const id = uid("T");
    const order = demo.orders.find((o) => o.id === orderId);
    update((s) => ({
      ...s,
      profile: s.profile ?? { name: contact.name, email: contact.email, phone: "", city: "", country: "" },
      tickets: [{ id, kind, subject: kinds.find((k) => k.id === kind)!.label, message, orderId: orderId || undefined, shop: order?.shop ?? (shopName || undefined), status: "ouvert", createdAt: today() }, ...s.tickets],
      orders: kind === "remboursement" && order ? s.orders.map((o) => (o.id === order.id ? { ...o, status: "non reçue" } : o)) : s.orders,
    }));
    setSent(id);
    setMessage("");
  }

  if (sent) {
    return (
      <div className="card pop space-y-3" role="status">
        <p className="eyebrow flex items-center gap-3 text-pulse"><SuccessCheck />Demande reçue</p>
        <p className="text-white">Ticket <span className="font-mono text-iris">{sent}</span> transmis à l&apos;équipe.</p>
        <p className="text-sm text-ash">Première réponse en {site.support.firstResponse}, par e-mail et dans votre compte. Vous n&apos;aurez pas à répéter votre problème : tout l&apos;historique suit le ticket.</p>
        <button className="btn" onClick={() => setSent(null)}>Nouvelle demande</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Motif">
        {kinds.map((k) => (
          <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} className={`pill ${kind === k.id ? "border-white text-white" : "text-ash hover:text-white"}`}>{k.label}</button>
        ))}
      </div>

      {!known && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="s-name">Nom</label><input id="s-name" required autoComplete="name" className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="s-email">E-mail pour la réponse</label><input id="s-email" type="email" required autoComplete="email" className="input" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
        </div>
      )}
      {known && <p className="text-sm text-ash">Réponse envoyée à <span className="font-mono text-iris">{contactLabel}</span></p>}
      {supabaseEnabled && !known && kind !== "contact" && <p className="text-sm text-ash">Pour un signalement ou un remboursement, <a href="/connexion?next=/support" className="link">connectez-vous</a> : la demande est rattachée à votre commande.</p>}

      {kind !== "contact" && (
        orders.length ? (
          <div>
            <label className="label" htmlFor="s-order">Commande concernée</label>
            <select id="s-order" required={kind === "remboursement"} className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">{kind === "signalement" ? "Aucune (signalement général)" : "Choisir…"}</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        ) : (
          <div><label className="label" htmlFor="s-ref">{kind === "remboursement" ? "Numéro de commande" : "Boutique concernée"}</label><input id="s-ref" required className="input font-mono" value={kind === "remboursement" ? orderId : shopName} onChange={(e) => (kind === "remboursement" ? setOrderId(e.target.value) : setShopName(e.target.value))} /></div>
        )
      )}

      <div>
        <label className="label" htmlFor="s-msg">{kind === "contact" ? "Votre question" : "Que s'est-il passé ?"}</label>
        <textarea id="s-msg" required rows={5} maxLength={2000} className="input" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      {kind === "remboursement" && (
        <p className="text-xs leading-relaxed text-iron">Le vendeur a 72 h pour vous rembourser ou prouver la livraison. Passé ce délai, l&apos;administrateur tranche, et le vendeur peut être suspendu.</p>
      )}
      {error && <p className="text-sm text-alarm" role="alert">{error}</p>}
      <button className="btn-solid" data-haptic disabled={pending}>{pending ? "Envoi…" : "Envoyer à l'administrateur"}</button>
    </form>
  );
}

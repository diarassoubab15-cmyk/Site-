"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { NotificationPrefs } from "./NotificationPrefs";
import { formatPrice } from "@/lib/format";
import { paymentMethods } from "@/lib/payments";
import { today, uid, update, useDemo, type DemoOrder } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { toast } from "@/lib/toast";
import type { LiveAccount } from "@/lib/views";
import { deleteAccount, markOrder, updateProfile } from "@/app/actions";

const statusColor: Record<DemoOrder["status"], string> = {
  "en attente de paiement": "bg-iron",
  confirmée: "bg-sky",
  expédiée: "bg-amber",
  livrée: "bg-pulse",
  "non reçue": "bg-alarm",
  remboursée: "bg-iris-glow",
  annulée: "bg-charcoal",
};

export function AccountView({ live }: { live?: LiveAccount | null }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState("");

  const p = supabaseEnabled ? live?.profile ?? null : demo.profile;
  const orders = supabaseEnabled ? live?.orders ?? [] : demo.orders;
  const tickets = supabaseEnabled ? live?.tickets ?? [] : demo.tickets;

  if (!p) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-white">Vous n&apos;êtes pas connecté.</p>
        <Link href="/connexion" className="btn-solid">Se connecter</Link>
      </div>
    );
  }

  /** Exécute l'action réelle (Supabase) ou la version démo, puis rafraîchit. */
  function run(real: () => Promise<{ ok: boolean; error?: string }>, fake: () => void, success = "Enregistré") {
    setError("");
    if (!supabaseEnabled) {
      fake();
      return toast(success);
    }
    start(async () => {
      const r = await real();
      if (!r.ok) {
        setError(r.error ?? "Erreur");
        toast(r.error ?? "Erreur", "error");
      } else toast(success);
      router.refresh();
    });
  }

  function received(o: DemoOrder) {
    run(() => markOrder({ id: o.uuid, status: "delivered" }), () => update((s) => ({ ...s, orders: s.orders.map((x) => (x.id === o.id ? { ...x, status: "livrée" } : x)) })), "Réception confirmée");
  }
  function notReceived(o: DemoOrder) {
    run(
      () => markOrder({ id: o.uuid, status: "not_received" }),
      () =>
        update((s) => ({
          ...s,
          orders: s.orders.map((x) => (x.id === o.id ? { ...x, status: "non reçue" } : x)),
          tickets: [{ id: uid("T"), kind: "remboursement", subject: "Produit non reçu", message: `Commande ${o.id} non reçue.`, orderId: o.id, shop: o.shop, status: "ouvert", createdAt: today() }, ...s.tickets],
        })),
      "Litige ouvert : le vendeur a 72 h",
    );
  }

  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = { name: String(f.get("name") ?? ""), phone: String(f.get("phone") ?? ""), city: String(f.get("city") ?? ""), country: String(f.get("country") ?? "") };
    run(() => updateProfile(v), () => update((s) => ({ ...s, profile: { ...v, email: String(f.get("email") ?? s.profile?.email ?? "") } })), "Profil enregistré");
    setEdit(false);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ profil: p, commandes: orders, demandes: tickets, avis: supabaseEnabled ? undefined : demo.reviews }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mes-donnees-nexora.json";
    a.click();
  }

  function removeAccount() {
    if (!confirm("Supprimer définitivement votre compte et toutes vos données ?")) return;
    if (!supabaseEnabled) return update((s) => ({ ...s, profile: null, orders: [], tickets: [], reviews: [], payouts: [] }));
    start(async () => {
      const r = await deleteAccount({ confirm: true });
      if (!r.ok) return setError(r.error);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-8">
        {error && <p className="rounded-[6px] border border-alarm/40 px-4 py-3 text-sm text-alarm" role="alert">{error}</p>}
        <section className="card" aria-labelledby="cmd">
          <h2 id="cmd" className="mb-6 text-xl font-medium text-white">Mes commandes</h2>
          {orders.length === 0 && <p className="text-sm text-ash">Aucune commande. <Link href="/marketplace" className="link">Parcourir la marketplace</Link></p>}
          <ul className="divide-y divide-line" data-reveal suppressHydrationWarning>
            {orders.map((o) => (
              <li key={o.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-white">{o.productName} <span className="text-ash">× {o.qty}</span></p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-ash">
                    <span>{o.id}</span><span>·</span><span>{o.shop}</span><span>·</span><span>{formatPrice(o.total)}</span><span>·</span><span>{paymentMethods[o.method].label}</span>
                  </p>
                  <p className="mt-1.5 flex items-center gap-2 font-mono text-xs text-bone"><span className={`h-1.5 w-1.5 rounded-full ${statusColor[o.status]}`} />{o.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(o.status === "confirmée" || o.status === "expédiée") && (
                    <>
                      <button className="btn px-3 py-1.5 text-xs" disabled={pending} onClick={() => received(o)}>J&apos;ai reçu</button>
                      <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => notReceived(o)}>Pas reçu</button>
                    </>
                  )}
                  {o.status === "livrée" && o.product && <Link href={`/produits/${o.product}#avis`} className="btn px-3 py-1.5 text-xs">Laisser un avis</Link>}
                  {o.status === "non reçue" && <span className="text-xs text-alarm">Litige ouvert · le vendeur a 72 h</span>}
                  {o.status === "en attente de paiement" && <span className="text-xs text-iron">En attente de la confirmation de l&apos;opérateur</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="tk">
          <h2 id="tk" className="mb-6 text-xl font-medium text-white">Mes demandes au SAV</h2>
          {tickets.length === 0 ? <p className="text-sm text-ash">Aucune demande. <Link href="/support" className="link">Contacter le SAV</Link></p> : (
            <ul className="space-y-3">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-4 rounded-[6px] border border-line px-4 py-3 text-sm">
                  <span><span className="font-mono text-xs text-iris">{t.id}</span> <span className="text-white">{t.subject}</span>{t.shop && <span className="text-ash"> · {t.shop}</span>}</span>
                  <span className="badge">{t.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-8">
        <section id="profil" className="card scroll-mt-24" aria-labelledby="pf">
          <div className="mb-6 flex items-center justify-between">
            <h2 id="pf" className="text-xl font-medium text-white">Profil</h2>
            <button className="text-sm text-ash hover:text-white" onClick={() => setEdit(!edit)}>{edit ? "Fermer" : "Modifier"}</button>
          </div>
          {edit ? (
            <form className="space-y-3" onSubmit={saveProfile}>
              <input name="name" defaultValue={p.name} placeholder="Nom" aria-label="Nom" className="input" />
              {!supabaseEnabled && <input name="email" defaultValue={p.email} placeholder="E-mail" aria-label="E-mail" className="input" />}
              <input name="phone" defaultValue={p.phone} placeholder="Téléphone" aria-label="Téléphone" className="input" />
              <input name="city" defaultValue={p.city} placeholder="Ville et quartier" aria-label="Ville et quartier" className="input" />
              <input name="country" defaultValue={p.country} placeholder="Pays" aria-label="Pays" className="input" />
              <button className="btn-solid w-full" disabled={pending}>Enregistrer</button>
            </form>
          ) : (
            <dl className="space-y-2 text-sm">
              {([["Nom", p.name], ["E-mail", p.email], ["Téléphone", p.phone], ["Adresse", [p.city, p.country].filter(Boolean).join(", ")]] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-ash">{k}</dt><dd className="text-right text-bone">{v || "—"}</dd></div>
              ))}
            </dl>
          )}
        </section>
        <section className="card" aria-labelledby="nt">
          <h2 id="nt" className="mb-4 text-xl font-medium text-white">Notifications e-mail</h2>
          <NotificationPrefs role="client" initial={live?.prefs} />
        </section>
        <section className="card" aria-labelledby="dz">
          <h2 id="dz" className="mb-2 text-xl font-medium text-white">Données personnelles</h2>
          <p className="mb-4 text-sm text-ash">Téléchargez ou supprimez toutes vos données à tout moment.</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={exportData}>Exporter</button>
            <button className="btn-danger" disabled={pending} onClick={removeAccount}>Supprimer mon compte</button>
          </div>
        </section>
      </div>
    </div>
  );
}

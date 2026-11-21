import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CartPanel, PaymentPreference } from "@/components/SettingsPanels";
import { formatDate, formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { supabaseEnabled } from "@/lib/supabase/env";
import { currentUser } from "@/lib/supabase/server";
import { loadAccount } from "@/lib/server-data";

export const metadata: Metadata = { title: "Réglages", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TONE: Record<string, string> = {
  "en attente de paiement": "text-amber", confirmée: "text-sky", expédiée: "text-iris-glow", livrée: "text-pulse",
  "non reçue": "text-alarm", remboursée: "text-bone", annulée: "text-iron",
};

/** Réglages de l'acheteur (connexion obligatoire) : paiement préféré, panier, historique d'achats. */
export default async function Reglages() {
  if (!supabaseEnabled) redirect("/compte");
  const u = await currentUser();
  if (!u) redirect("/connexion?next=/reglages");
  const account = await loadAccount();
  const preferred = (u.profile?.preferred_payment ?? null) as PaymentMethodId | null;
  const p = account?.profile;
  const known = p?.name && p.phone && p.city ? { name: p.name, phone: p.phone, city: p.city } : null;
  const orders = account?.orders ?? [];

  return (
    <div className="reglages-page">
      <section className="container-x max-w-4xl space-y-6 pb-24 pt-16">
        <header>
          <h1 className="h-display fade-up" style={{ color: "#70b8ff" }}>Réglages</h1>
          <p className="fade-up mt-4 text-ash" style={{ ["--d" as string]: 1 }}>
            Connecté : <span className="font-mono text-bone">{u.user.email || u.user.phone}</span>
          </p>
        </header>

        <section className="reglages-card" aria-labelledby="pref-paiement">
          <h2 id="pref-paiement" className="text-lg font-medium text-white">Moyen de paiement préféré</h2>
          <p className="mb-4 mt-1 text-sm text-ash">Présélectionné à chaque achat, quand la boutique l&apos;accepte. Vous pouvez toujours en changer au moment de payer.</p>
          <PaymentPreference initial={preferred} />
        </section>

        <section id="panier" className="reglages-card scroll-mt-24" aria-labelledby="panier-titre">
          <h2 id="panier-titre" className="mb-4 text-lg font-medium text-white">Panier</h2>
          <CartPanel preferred={preferred} known={known} />
        </section>

        <section className="reglages-card" aria-labelledby="historique">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="historique" className="text-lg font-medium text-white">Historique d&apos;achats</h2>
            <Link href="/compte" className="text-sm text-ash hover:text-white">Suivi, réception et litiges</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-ash">Aucun achat pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-line" data-history>
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="min-w-0">
                    {o.product ? <Link href={`/produits/${o.product}`} className="text-white hover:underline">{o.productName}</Link> : <span className="text-white">{o.productName}</span>}
                    <span className="block text-xs text-ash">{o.shop} · {formatDate(o.createdAt)} · {o.qty} × · {paymentMethods[o.method]?.label ?? o.method} · <span className="font-mono">{o.id}</span></span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className={`text-xs ${TONE[o.status] ?? "text-bone"}`}>{o.status}</span>
                    <span className="font-mono text-white">{formatPrice(o.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="reglages-card flex flex-wrap items-center justify-between gap-3" aria-label="Compte">
          <p className="text-sm text-ash">Notifications par e-mail, informations personnelles, export ou suppression du compte.</p>
          <Link href="/compte" className="btn">Mon compte</Link>
        </section>
      </section>
    </div>
  );
}

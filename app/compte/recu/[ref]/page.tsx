import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { currentUser } from "@/lib/supabase/server";
import { supabaseEnabled } from "@/lib/supabase/env";
import { orderStatusFr } from "@/lib/views";

export const metadata: Metadata = { title: "Reçu de commande", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Reçu clair d'une commande (à imprimer, enregistrer en PDF ou partager) : qui a été payé, combien, comment.
 * Lisible par l'acheteur seul (règles de la base sur les commandes).
 */
export default async function Receipt({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  if (!supabaseEnabled || !/^[A-Z0-9-]{4,40}$/i.test(ref)) notFound();
  const u = await currentUser();
  if (!u) redirect(`/connexion?next=/compte/recu/${encodeURIComponent(ref)}`);
  const { data: o } = await u.sb.from("orders")
    .select("ref, created_at, product_name, shop_name, qty, total, delivery_fee, delivery_zone, method, status, shipping_name, shipping_phone, shipping_city, shipping_district, shipping_landmark, eta_min, eta_max")
    .eq("ref", ref).eq("buyer_id", u.user.id).maybeSingle();
  if (!o) notFound();
  const goods = o.total - (o.delivery_fee ?? 0);
  const rows: [string, string][] = [
    ["Commande", o.ref],
    ["Date", new Date(o.created_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })],
    ["Vendeur (payé directement)", o.shop_name ?? "—"],
    ["Produit", `${o.qty} × ${o.product_name ?? "Produit"}`],
    ["Prix des produits", formatPrice(goods)],
    ["Livraison", o.delivery_fee ? `${formatPrice(o.delivery_fee)}${o.delivery_zone ? ` (${o.delivery_zone})` : ""}` : o.delivery_zone ? `Gratuite (${o.delivery_zone})` : "À convenir avec le vendeur"],
    ["Moyen de paiement", paymentMethods[o.method as PaymentMethodId]?.label ?? o.method],
    ["État", orderStatusFr[o.status] ?? o.status],
    ["Livraison à", [o.shipping_name, o.shipping_phone, [o.shipping_district, o.shipping_city].filter(Boolean).join(", "), o.shipping_landmark ? `repère : ${o.shipping_landmark}` : ""].filter(Boolean).join(" · ")],
  ];
  if (o.eta_min && o.eta_max) rows.push(["Livraison prévue", `du ${new Date(o.eta_min).toLocaleDateString("fr-FR")} au ${new Date(o.eta_max).toLocaleDateString("fr-FR")}`]);
  return (
    <section className="container-x max-w-xl py-12">
      <div className="card space-y-5 print:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-white">NEXORA</p>
            <h1 className="mt-2 text-2xl font-medium text-white">Reçu de commande</h1>
          </div>
          <p className="font-mono text-sm text-iris">{o.ref}</p>
        </div>
        <dl className="divide-y divide-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[150px_1fr] gap-3 py-2.5"><dt className="text-ash">{k}</dt><dd className="text-bone">{v}</dd></div>
          ))}
          <div className="grid grid-cols-[150px_1fr] gap-3 py-3"><dt className="font-medium text-white">Total</dt><dd className="font-mono text-lg text-white">{formatPrice(o.total)}</dd></div>
        </dl>
        <p className="text-xs text-iron">
          Le paiement est versé directement au vendeur, sans commission NEXORA. Produit non reçu ou non conforme : signalez-le depuis votre compte,
          le vendeur a 72 h pour vous rembourser, puis NEXORA tranche.
        </p>
        <div className="flex flex-wrap gap-2 print:hidden">
          <PrintButton />
          <Link href="/compte" className="btn">Retour à mon compte</Link>
        </div>
      </div>
    </section>
  );
}

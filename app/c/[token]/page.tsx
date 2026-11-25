import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmOrderButton } from "@/components/TokenActions";
import { formatPrice } from "@/lib/format";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Confirmer ma commande", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Lien envoyé au client sur WhatsApp : il confirme sa commande en un toucher, sans compte (évite les fausses commandes). */
export default async function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!supabaseEnabled || !/^[a-f0-9]{20,64}$/.test(token)) notFound();
  const { data } = await (await supabaseServer()).rpc("order_by_confirm_token", { p_token: token });
  const o = data?.[0];
  if (!o) notFound();
  return (
    <section className="container-x max-w-md py-16">
      <p className="eyebrow">Commande {o.ref}</p>
      <h1 className="h-section mt-3 text-3xl">Confirmez votre commande</h1>
      <div className="card mt-6 space-y-3 text-sm">
        <p className="text-white">{o.qty} × {o.product_name}</p>
        <p className="text-ash">Boutique : <span className="text-bone">{o.shop_name}</span></p>
        <p className="text-ash">Livraison à : <span className="text-bone">{o.city}</span></p>
        <p className="text-ash">Paiement : <span className="text-bone">{paymentMethods[o.method as PaymentMethodId]?.label}</span></p>
        <p className="flex justify-between border-t border-line pt-3"><span className="text-ash">Total</span><span className="font-mono text-lg text-white">{formatPrice(o.total)}</span></p>
      </div>
      <div className="mt-6">
        {o.confirmed
          ? <p className="rounded-[18px] bg-[#e9f8ef] px-4 py-3 text-center text-[#0f6b3f]">Commande déjà confirmée. Merci !</p>
          : <ConfirmOrderButton token={token} />}
      </div>
      <p className="mt-4 text-center text-xs text-iron">Vous n&apos;avez pas passé cette commande ? Ignorez simplement ce message.</p>
    </section>
  );
}

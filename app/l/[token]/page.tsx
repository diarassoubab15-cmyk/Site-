import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourierButtons } from "@/components/TokenActions";
import { formatPrice } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Livraison", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Page du livreur (lien personnel envoyé par le vendeur) : où livrer, qui appeler, combien encaisser. */
export default async function CourierPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!supabaseEnabled || !/^[a-f0-9]{20,64}$/.test(token)) notFound();
  const { data } = await (await supabaseServer()).rpc("order_for_courier", { p_token: token });
  const o = data?.[0];
  if (!o) notFound();
  const cod = o.method === "cash_on_delivery";
  const open = o.status === "confirmed" || o.status === "shipped";
  const tel = o.phone.replace(/[^\d+]/g, "");
  return (
    <section className="container-x max-w-md py-12">
      <p className="eyebrow">{o.shop_name} · {o.ref}</p>
      <h1 className="h-section mt-3 text-3xl">Livraison</h1>
      <div className="card mt-6 space-y-3 text-sm">
        <p className="text-white">{o.qty} × {o.product_name}</p>
        <p className="text-ash">Client : <span className="text-bone">{o.name}</span></p>
        <p className="text-ash">Adresse : <span className="text-bone">{[o.district, o.city].filter(Boolean).join(", ")}</span></p>
        {o.landmark && <p className="text-ash">Repère : <span className="text-bone">{o.landmark}</span></p>}
        {o.zone && <p className="text-ash">Zone : <span className="text-bone">{o.zone}</span></p>}
        <p className="flex justify-between border-t border-line pt-3">
          <span className="text-ash">{cod ? "À encaisser" : "Déjà payé"}</span>
          <span className="font-mono text-lg text-white">{cod ? formatPrice(o.total) : "0 FCFA"}</span>
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a href={`tel:${tel}`} className="btn">Appeler</a>
          <a href={`https://wa.me/${tel.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn">WhatsApp</a>
        </div>
      </div>
      <div className="mt-6">
        {open
          ? <CourierButtons token={token} cod={cod} amount={formatPrice(o.total)} />
          : <p className="rounded-[18px] bg-lift px-4 py-3 text-center text-bone">{o.refused ? "Colis refusé par le client." : o.status === "delivered" ? "Colis livré. Merci !" : "Cette livraison n'est plus en cours."}</p>}
      </div>
    </section>
  );
}

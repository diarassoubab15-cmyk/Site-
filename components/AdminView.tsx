"use client";
import { useState } from "react";
import { categories } from "@/lib/data";
import { update, useDemo, type SellerStatus } from "@/lib/demo-store";

const tabs: { id: SellerStatus | "tous"; label: string }[] = [
  { id: "en attente", label: "À vérifier" },
  { id: "autorisé", label: "Autorisés" },
  { id: "suspendu", label: "Suspendus" },
  { id: "refusé", label: "Refusés" },
  { id: "tous", label: "Tous" },
];

const dot: Record<SellerStatus, string> = { "en attente": "bg-amber", autorisé: "bg-pulse", suspendu: "bg-alarm", refusé: "bg-iron", fermé: "bg-charcoal" };

export function AdminView() {
  const demo = useDemo();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("en attente");
  const list = demo.sellers.filter((s) => tab === "tous" || s.status === tab);
  const count = (st: SellerStatus) => demo.sellers.filter((s) => s.status === st).length;
  const openTickets = demo.tickets.filter((t) => t.status !== "résolu");

  const setStatus = (id: string, status: SellerStatus) => update((s) => ({ ...s, sellers: s.sellers.map((x) => (x.id === id ? { ...x, status } : x)) }));
  const setSellerByName = (name: string | undefined, status: SellerStatus) => name && update((s) => ({ ...s, sellers: s.sellers.map((x) => (x.shopName === name ? { ...x, status } : x)) }));

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {([["À vérifier", count("en attente"), "text-amber"], ["Vendeurs autorisés", count("autorisé"), "text-pulse"], ["Suspendus", count("suspendu"), "text-alarm"], ["Litiges ouverts", openTickets.length, "text-iris-glow"]] as const).map(([l, n, c]) => (
          <div key={l} className="card p-5">
            <p className="text-xs text-ash">{l}</p>
            <p className={`mt-2 font-mono text-3xl ${c}`}>{n}</p>
          </div>
        ))}
      </div>

      <section className="card" aria-labelledby="vendeurs">
        <h2 id="vendeurs" className="text-xl font-medium text-white">Vendeurs</h2>
        <div className="my-6 flex flex-wrap gap-2" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`pill ${tab === t.id ? "border-white text-white" : "text-ash hover:text-white"}`}>{t.label}</button>
          ))}
        </div>
        {list.length === 0 && <p className="text-sm text-iron">Rien ici.</p>}
        <ul className="divide-y divide-line">
          {list.map((s) => (
            <li key={s.id} className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-white"><span className={`h-2 w-2 rounded-full ${dot[s.status]}`} />{s.shopName} <span className="font-mono text-xs text-iron">{s.id}</span></p>
                <p className="mt-1 text-sm text-ash">{s.owner} · {s.city}, {s.country} · {categories.find((c) => c.slug === s.category)?.name ?? s.category}</p>
                <p className="mt-1 font-mono text-xs text-iris">{s.email} <span className="text-ash">· {s.phone}</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.status === "en attente" && (<>
                  <button className="btn-solid px-3 py-1.5 text-xs" onClick={() => setStatus(s.id, "autorisé")}>Autoriser</button>
                  <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => setStatus(s.id, "refusé")}>Refuser</button>
                </>)}
                {s.status === "autorisé" && <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => setStatus(s.id, "suspendu")}>Suspendre</button>}
                {(s.status === "suspendu" || s.status === "refusé") && <button className="btn px-3 py-1.5 text-xs" onClick={() => setStatus(s.id, "autorisé")}>Autoriser</button>}
                {s.status === "fermé" && <span className="text-xs text-iron">Fermée par le vendeur</span>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="litiges">
        <h2 id="litiges" className="mb-6 text-xl font-medium text-white">Signalements et litiges</h2>
        {demo.tickets.length === 0 && <p className="text-sm text-iron">Aucune demande pour le moment.</p>}
        <ul className="space-y-3">
          {demo.tickets.map((t) => (
            <li key={t.id} className="rounded-[6px] border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-white"><span className="font-mono text-xs text-iris">{t.id}</span> {t.subject}{t.shop && <span className="text-ash"> · {t.shop}</span>}{t.orderId && <span className="font-mono text-xs text-ash"> · {t.orderId}</span>}</p>
                <span className="badge">{t.status}</span>
              </div>
              <p className="mt-2 text-sm text-ash">{t.message}</p>
              {t.status !== "résolu" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.kind === "remboursement" && t.orderId && (
                    <button className="btn px-3 py-1.5 text-xs" onClick={() => update((s) => ({ ...s, orders: s.orders.map((o) => (o.id === t.orderId ? { ...o, status: "remboursée" } : o)), tickets: s.tickets.map((x) => (x.id === t.id ? { ...x, status: "résolu" } : x)) }))}>Remboursement effectué</button>
                  )}
                  {t.shop && <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => setSellerByName(t.shop, "suspendu")}>Suspendre le vendeur</button>}
                  <button className="btn px-3 py-1.5 text-xs" onClick={() => update((s) => ({ ...s, tickets: s.tickets.map((x) => (x.id === t.id ? { ...x, status: "résolu" } : x)) }))}>Marquer résolu</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

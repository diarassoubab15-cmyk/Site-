"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { categories } from "@/lib/data";
import { update, useDemo, type SellerStatus } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { toast } from "@/lib/toast";
import type { LiveAdmin } from "@/lib/views";
import { adminResolveTicket, adminSetShopStatus, adminSetSubscription } from "@/app/actions";
import { plans } from "@/lib/plans";
import { CountUp } from "./CountUp";
import { AdminPayments } from "./AdminPayments";
import { AdminRewards } from "./AdminRewards";
import { AdminVideos } from "./AdminVideos";
import { AdminEdits } from "./AdminEdits";

const tabs: { id: SellerStatus | "tous"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en attente", label: "À vérifier" },
  { id: "autorisé", label: "Autorisés" },
  { id: "suspendu", label: "Suspendus" },
  { id: "refusé", label: "Refusés" },
];
type PlanId = "essentiel" | "pro" | "business";
const planName = (id?: string | null) => plans.find((p) => p.id === id)?.name ?? "Aucun";
const planColor = (id?: string | null) => plans.find((p) => p.id === id)?.color ?? "#8a8f98";
const frDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const dot: Record<SellerStatus, string> = { "en attente": "bg-amber", autorisé: "bg-pulse", suspendu: "bg-alarm", refusé: "bg-iron", fermé: "bg-charcoal" };

type AdminTicket = LiveAdmin["tickets"][number] & { uuid?: string };

export function AdminView({ live }: { live?: LiveAdmin | null }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("tous");
  const [search, setSearch] = useState("");
  const [openPlan, setOpenPlan] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState<{ plan: PlanId; months: number }>({ plan: "pro", months: 1 });
  const sellers = supabaseEnabled ? live?.sellers ?? [] : demo.sellers;
  const tickets: AdminTicket[] = supabaseEnabled ? live?.tickets ?? [] : demo.tickets;
  const needle = search.trim().toLowerCase();
  const list = sellers.filter((s) => (tab === "tous" || s.status === tab) && (!needle || [s.shopName, s.owner, s.email, s.phone, s.city].some((v) => v?.toLowerCase().includes(needle))));
  const count = (st: SellerStatus) => sellers.filter((s) => s.status === st).length;
  const openTickets = tickets.filter((t) => t.status !== "résolu");
  const payments = supabaseEnabled ? live?.payments ?? [] : demo.subPayments;
  const paymentsToHandle = payments.filter((p) => p.status === "contact" || p.status === "déclaré").length;

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
  const statusMsg: Record<SellerStatus, string> = { autorisé: "Boutique autorisée", refusé: "Demande refusée", suspendu: "Boutique suspendue", "en attente": "Remise en attente", fermé: "Boutique fermée" };
  const setStatus = (id: string, status: SellerStatus) =>
    run(() => adminSetShopStatus({ shopId: id, status }), () => update((s) => ({ ...s, sellers: s.sellers.map((x) => (x.id === id ? { ...x, status } : x)) })), statusMsg[status]);
  const setPlan = (id: string, plan: PlanId, active: boolean, months: number) =>
    run(
      () => adminSetSubscription({ shopId: id, plan, active, months }),
      () => update((s) => ({ ...s, sellers: s.sellers.map((x) => (x.id === id ? { ...x, plan, planActive: active, planUntil: active ? new Date(Date.now() + months * 30.5 * 864e5).toISOString().slice(0, 10) : null } : x)) })),
      active ? `Forfait ${planName(plan)} activé` : "Forfait désactivé",
    );
  const suspendFromTicket = (t: AdminTicket) =>
    run(
      () => (t.shopId ? adminSetShopStatus({ shopId: t.shopId, status: "suspendu" }) : Promise.resolve({ ok: false, error: "Boutique inconnue" })),
      () => update((s) => ({ ...s, sellers: s.sellers.map((x) => (x.shopName === t.shop ? { ...x, status: "suspendu" } : x)) })),
      "Vendeur suspendu",
    );
  const resolve = (t: AdminTicket, refund: boolean) =>
    run(
      () => adminResolveTicket({ ticketId: t.uuid, refundOrderId: refund ? t.orderUuid : undefined }),
      () =>
        update((s) => ({
          ...s,
          orders: refund ? s.orders.map((o) => (o.id === t.orderId ? { ...o, status: "remboursée" } : o)) : s.orders,
          tickets: s.tickets.map((x) => (x.id === t.id ? { ...x, status: "résolu" } : x)),
        })),
      refund ? "Remboursement enregistré" : "Demande résolue",
    );

  return (
    <div className="space-y-10">
      {error && <p className="rounded-[6px] border border-alarm/40 px-4 py-3 text-sm text-alarm" role="alert">{error}</p>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {([["À vérifier", count("en attente"), "text-amber"], ["Vendeurs autorisés", count("autorisé"), "text-pulse"], ["Paiements à traiter", paymentsToHandle, "text-sky"], ["Litiges ouverts", openTickets.length, "text-iris-glow"]] as const).map(([l, n, c]) => (
          <div key={l} className="card p-5">
            <p className="text-xs text-ash">{l}</p>
            <p className={`mt-2 font-mono text-3xl ${c}`}><CountUp value={n} /></p>
          </div>
        ))}
      </div>

      <section className="card" aria-labelledby="vendeurs">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="vendeurs" className="text-xl font-medium text-white">Tous les vendeurs <span className="font-mono text-sm text-iron">({sellers.length})</span></h2>
            <p className="mt-1 text-sm text-ash">Autorisez les boutiques, puis activez ou désactivez leur forfait quand vous voulez.</p>
          </div>
          <label className="w-full sm:w-72"><span className="sr-only">Rechercher un vendeur</span>
            <input className="input" type="search" placeholder="Rechercher : nom, ville, téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>
        <div className="my-6 flex flex-wrap gap-2" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`pill ${tab === t.id ? "border-white text-white" : "text-ash hover:text-white"}`}>
              {t.label} <span className="font-mono text-xs text-iron">{t.id === "tous" ? sellers.length : count(t.id)}</span>
            </button>
          ))}
        </div>
        {list.length === 0 && (
          <p className="rounded-[18px] bg-lift p-4 text-sm text-ash">
            {sellers.length === 0 ? "Aucun vendeur pour le moment. Dès qu'une personne remplit « Créer ma boutique », sa demande apparaît ici." : "Aucun vendeur ne correspond."}
          </p>
        )}
        <ul className="divide-y divide-line" data-reveal suppressHydrationWarning>
          {list.map((s) => (
            <li key={s.id} className="py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-white"><span className={`h-2 w-2 rounded-full ${dot[s.status]}`} />{s.shopName} <span className="badge">{s.status}</span></p>
                  {s.status === "suspendu" && s.reason && <p className="mt-1 rounded-full bg-[#fdecec] px-2.5 py-0.5 text-xs text-alarm">{s.reason}</p>}
                  <p className="mt-1 text-sm text-ash">{s.owner} · {s.city}, {s.country} · {categories.find((c) => c.slug === s.category)?.name ?? s.category}</p>
                  <p className="mt-1 font-mono text-xs text-iris">{s.email} <span className="text-ash">· {s.phone}</span></p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-[#ffffff]" style={{ background: s.planActive ? planColor(s.plan) : "#8a8f98" }}>
                      {s.plan ? `Forfait ${planName(s.plan)}` : "Aucun forfait"}
                    </span>
                    <span className="text-xs text-ash">{s.planActive ? (s.planUntil ? `actif jusqu'au ${frDate(s.planUntil)}` : "actif") : s.plan ? "désactivé" : "jamais activé"}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status === "en attente" && (<>
                    <button className="btn-solid px-3 py-1.5 text-xs" data-haptic disabled={pending} onClick={() => setStatus(s.id, "autorisé")}>Autoriser</button>
                    <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => setStatus(s.id, "refusé")}>Refuser</button>
                  </>)}
                  {s.status === "autorisé" && <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => setStatus(s.id, "suspendu")}>Suspendre</button>}
                  {(s.status === "suspendu" || s.status === "refusé") && <button className="btn-solid px-3 py-1.5 text-xs" disabled={pending} onClick={() => setStatus(s.id, "autorisé")}>{s.status === "suspendu" ? "Autoriser à reprendre" : "Autoriser"}</button>}
                  {s.status === "fermé" && <span className="text-xs text-iron">Fermée par le vendeur</span>}
                  {s.status !== "fermé" && (
                    <button className="btn px-3 py-1.5 text-xs" aria-expanded={openPlan === s.id} onClick={() => { setOpenPlan(openPlan === s.id ? null : s.id); setPlanDraft({ plan: (s.plan as PlanId) ?? "pro", months: 1 }); }}>
                      Gérer le forfait
                    </button>
                  )}
                  {s.planActive && <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => setPlan(s.id, (s.plan as PlanId) ?? "essentiel", false, 1)}>Désactiver le forfait</button>}
                </div>
              </div>
              {openPlan === s.id && (
                <div className="mt-4 space-y-4 rounded-[18px] bg-lift p-4">
                  <fieldset>
                    <legend className="label">Forfait</legend>
                    <div className="flex flex-wrap gap-2">
                      {plans.map((pl) => (
                        <label key={pl.id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${planDraft.plan === pl.id ? "border-white text-white" : "border-line text-bone"}`}>
                          <input type="radio" name={`plan-${s.id}`} className="accent-[#5433eb]" checked={planDraft.plan === pl.id} onChange={() => setPlanDraft({ ...planDraft, plan: pl.id })} />
                          {pl.name} <span className="font-mono text-xs text-iron">{pl.monthly.toLocaleString("fr-FR")} F</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label className="label" htmlFor={`months-${s.id}`}>Durée</label>
                    <select id={`months-${s.id}`} className="input max-w-xs" value={planDraft.months} onChange={(e) => setPlanDraft({ ...planDraft, months: Number(e.target.value) })}>
                      {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} mois</option>)}
                    </select>
                    <p className="mt-1.5 text-xs text-iron">{s.planActive ? "Les mois s'ajoutent à la date de fin actuelle." : "Le forfait commence aujourd'hui."} Aucun paiement n&apos;est demandé au vendeur.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-solid px-4 py-2 text-sm" data-haptic disabled={pending} onClick={() => { setPlan(s.id, planDraft.plan, true, planDraft.months); setOpenPlan(null); }}>
                      {pending ? "Enregistrement…" : `Activer ${planName(planDraft.plan)} · ${planDraft.months} mois`}
                    </button>
                    <button className="btn px-4 py-2 text-sm" onClick={() => setOpenPlan(null)}>Annuler</button>
                  </div>
                  {s.status !== "autorisé" && <p className="text-xs text-[#8a5a00]">La boutique n&apos;est visible par les clients qu&apos;une fois autorisée ET avec un forfait actif.</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <AdminPayments live={live?.payments} />

      <AdminVideos live={live?.videos} />
      <AdminEdits live={live?.edits} />

      <AdminRewards live={live?.rewards} sellers={sellers} />

      <section className="card" aria-labelledby="litiges">
        <h2 id="litiges" className="mb-6 text-xl font-medium text-white">Signalements et litiges</h2>
        {tickets.length === 0 && <p className="text-sm text-iron">Aucune demande pour le moment.</p>}
        <ul className="space-y-3" data-reveal suppressHydrationWarning>
          {tickets.map((t) => (
            <li key={t.id} className="rounded-[6px] border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-white"><span className="font-mono text-xs text-iris">{t.id}</span> {t.subject}{t.shop && <span className="text-ash"> · {t.shop}</span>}{t.orderId && <span className="font-mono text-xs text-ash"> · {t.orderId}</span>}</p>
                <span className="badge">{t.status}</span>
              </div>
              <p className="mt-2 text-sm text-ash">{t.message}</p>
              {t.status !== "résolu" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.kind === "remboursement" && t.orderId && (
                    <button className="btn px-3 py-1.5 text-xs" disabled={pending} onClick={() => resolve(t, true)}>Remboursement effectué</button>
                  )}
                  {t.shop && <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => suspendFromTicket(t)}>Suspendre le vendeur</button>}
                  <button className="btn px-3 py-1.5 text-xs" disabled={pending} onClick={() => resolve(t, false)}>Marquer résolu</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

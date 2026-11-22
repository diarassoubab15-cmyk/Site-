"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import { uid, update, useDemo, type DemoSeller } from "@/lib/demo-store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { defaultFreeMonths, kindTitle, monthLabel, periodsFor, rewardTitle, shortDate, type RankingRow, type RewardKind, type RewardView } from "@/lib/rewards";
import { adminGrantReward, adminRanking, adminRevokeReward } from "@/app/actions";

type Kind = Exclude<RewardKind, "gift">;
const tabs: { id: Kind; label: string }[] = [
  { id: "month", label: "Mois" },
  { id: "semester", label: "Semestre" },
  { id: "year", label: "Année" },
];

/** Classement de démonstration, stable pour une période donnée. */
function demoRanking(sellers: DemoSeller[], key: string): RankingRow[] {
  const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return sellers
    .filter((s) => s.status === "autorisé" || s.status === "suspendu")
    .map((s) => {
      const n = h(s.id + key);
      return { shopId: s.id, shopName: s.shopName, owner: s.owner, phone: s.phone, delivered: 3 + (n % 40), revenue: 25000 + (n % 90) * 9500, rating: 3.5 + ((n >> 3) % 15) / 10, reviews: n % 25, disputes: (n >> 5) % 3 };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

function addMonths(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

/** Formulaire « offrir des mois » : mois choisi ou à la suite de l'abonnement. */
function GrantForm({ kind, defaultMonths, onSubmit, pending, withTitle }: { kind: RewardKind; defaultMonths: number; pending: boolean; withTitle?: boolean; onSubmit: (v: { freeMonths: number; startMonth?: string; title?: string; note?: string }) => void }) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [months, setMonths] = useState(defaultMonths);
  const [when, setWhen] = useState<"suite" | "mois">("suite");
  const [start, setStart] = useState(addMonths(thisMonth, 1).slice(0, 7));
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  return (
    <form
      className="mt-4 space-y-4 rounded-[6px] border border-iris/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ freeMonths: months, startMonth: when === "mois" && months > 0 ? start : undefined, title: withTitle ? title : undefined, note: note || undefined });
      }}
    >
      {withTitle && (
        <div><label className="label" htmlFor={`t-${kind}`}>Motif (visible par le vendeur)</label><input id={`t-${kind}`} required minLength={2} maxLength={120} className="input" placeholder="Ex. Merci pour votre fidélité" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="label" htmlFor={`m-${kind}`}>Mois offerts</label>
          <input id={`m-${kind}`} type="number" min={withTitle ? 1 : 0} max={12} className="input w-24 font-mono" value={months} onChange={(e) => setMonths(Math.max(0, Math.min(12, Number(e.target.value) || 0)))} />
        </div>
        {months > 0 && (
          <fieldset className="space-y-2 text-sm text-bone">
            <legend className="label">À partir de</legend>
            <label className="flex items-center gap-2"><input type="radio" checked={when === "suite"} onChange={() => setWhen("suite")} className="accent-[#5433eb]" />la fin de son abonnement en cours</label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={when === "mois"} onChange={() => setWhen("mois")} className="accent-[#5433eb]" />un mois précis :
              <input type="month" min={thisMonth} className="input w-44 py-1.5" value={start} onChange={(e) => { setStart(e.target.value); setWhen("mois"); }} aria-label="Mois offert" />
            </label>
          </fieldset>
        )}
      </div>
      {months > 0 && when === "mois" && <p className="text-xs text-iron">Offert : de {monthLabel(start)} {months > 1 ? `à ${monthLabel(addMonths(start, months - 1).slice(0, 7))}` : ""} inclus.</p>}
      {months === 0 && <p className="text-xs text-iron">Titre honorifique seulement (badge), sans mois offert.</p>}
      <div><label className="label" htmlFor={`n-${kind}`}>Note interne (facultatif)</label><input id={`n-${kind}`} maxLength={500} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <button className="btn-solid" data-haptic disabled={pending}>{pending ? "…" : "Confirmer la récompense"}</button>
    </form>
  );
}

export function AdminRewards({ live, sellers }: { live?: RewardView[]; sellers: DemoSeller[] }) {
  const demo = useDemo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<Kind>("month");
  const periods = useMemo(() => periodsFor(kind), [kind]);
  // Par défaut : la dernière période terminée (le mois dernier, le semestre précédent, l'an dernier).
  const [picked, setKey] = useState("");
  // Une période qui n'existe pas pour l'onglet choisi retombe sur la valeur par défaut (pas d'appel invalide).
  const key = periods.some((p) => p.key === picked) ? picked : periods[1]?.key ?? periods[0].key;
  const [rows, setRows] = useState<RankingRow[] | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [giftShop, setGiftShop] = useState("");

  const rewards = supabaseEnabled ? live ?? [] : demo.rewards;
  const winner = rewards.find((r) => !r.revoked && r.kind === kind && r.periodKey === key);
  const eligible = sellers.filter((s) => s.status === "autorisé" || s.status === "suspendu");

  useEffect(() => {
    setOpenRow(null);
    if (!supabaseEnabled) return setRows(demoRanking(demo.sellers, key));
    setRows(null);
    let alive = true;
    adminRanking({ kind, key }).then((r) => {
      if (!alive) return;
      if (r.ok) setRows(r.data ?? []);
      else toast(r.error, "error");
    });
    return () => {
      alive = false;
    };
  }, [kind, key, demo.sellers]);

  function grant(shopId: string, shopName: string, k: RewardKind, v: { freeMonths: number; startMonth?: string; title?: string; note?: string }) {
    const title = k === "gift" ? v.title ?? "Mois offerts" : rewardTitle(k, key);
    const done = `${title} : ${v.freeMonths} mois offert${v.freeMonths > 1 ? "s" : ""} à ${shopName}`;
    if (!supabaseEnabled) {
      const startsOn = v.freeMonths ? (v.startMonth ? `${v.startMonth}-01` : new Date().toISOString().slice(0, 10)) : null;
      const endsOn = startsOn ? addMonths(startsOn.slice(0, 7), v.freeMonths) : null;
      update((s) => ({ ...s, rewards: [{ id: uid("RW"), shopId, shopName, kind: k, periodKey: k === "gift" ? "gift" : key, title, freeMonths: v.freeMonths, startsOn, endsOn, note: v.note, revoked: false, createdAt: new Date().toISOString().slice(0, 10) }, ...s.rewards] }));
      setOpenRow(null);
      return toast(done);
    }
    start(async () => {
      const r = await adminGrantReward({ shopId, kind: k, periodKey: k === "gift" ? undefined : key, ...v });
      if (!r.ok) return toast(r.error, "error");
      toast(done);
      setOpenRow(null);
      setGiftShop("");
      router.refresh();
    });
  }

  function revoke(r: RewardView) {
    if (!confirm(`Retirer « ${r.title} » à ${r.shopName} ? Les mois offerts seront annulés.`)) return;
    if (!supabaseEnabled) {
      update((s) => ({ ...s, rewards: s.rewards.map((x) => (x.id === r.id ? { ...x, revoked: true } : x)) }));
      return toast("Récompense retirée");
    }
    start(async () => {
      const res = await adminRevokeReward({ id: r.id });
      toast(res.ok ? "Récompense retirée" : res.error ?? "Erreur", res.ok ? "ok" : "error");
      router.refresh();
    });
  }

  return (
    <section className="card space-y-8" aria-labelledby="recompenses">
      <div>
        <h2 id="recompenses" className="text-xl font-medium text-white">Récompenses</h2>
        <p className="mt-2 text-sm text-ash">
          Classement par ventes livrées sur la période (la note et les litiges vous aident à trancher). Vous seul désignez le gagnant et offrez des mois gratuits.
          {!supabaseEnabled && " Démo : chiffres fictifs."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-[6px] border border-line p-1" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={kind === t.id} onClick={() => setKind(t.id)} className={`rounded-[4px] px-4 py-1.5 text-sm ${kind === t.id ? "bg-white text-black" : "text-ash hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <select className="input w-auto" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Période">
          {periods.map((p, i) => <option key={p.key} value={p.key}>{p.label}{i === 0 ? " (en cours)" : ""}</option>)}
        </select>
      </div>

      {winner && (
        <div className="pop flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-amber/40 p-4">
          <p className="text-white">
            <span aria-hidden="true">🏆 </span>{winner.title} : <strong>{winner.shopName}</strong>
            <span className="block text-sm text-ash">
              {winner.freeMonths ? `${winner.freeMonths} mois offert${winner.freeMonths > 1 ? "s" : ""} · du ${shortDate(winner.startsOn!)} au ${shortDate(winner.endsOn!)}` : "Titre honorifique"}
            </span>
          </p>
          <button className="btn-danger px-3 py-1.5 text-xs" disabled={pending} onClick={() => revoke(winner)}>Retirer</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">{kindTitle[kind]} : classement</caption>
          <thead className="font-mono text-xs uppercase tracking-wider text-iron">
            <tr><th className="py-2 pr-3">#</th><th className="pr-3">Boutique</th><th className="pr-3">Ventes livrées</th><th className="pr-3">Chiffre d&apos;affaires</th><th className="pr-3">Note</th><th className="pr-3">Litiges</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows === null && <tr><td colSpan={7} className="py-6"><div className="skeleton h-4 w-1/2 rounded" /></td></tr>}
            {rows?.length === 0 && <tr><td colSpan={7} className="py-6 text-iron">Aucune boutique autorisée pour le moment.</td></tr>}
            {rows?.slice(0, 10).map((r, i) => (
              <tr key={r.shopId} className="align-top">
                <td className="py-3 pr-3 font-mono text-iris">{i + 1}</td>
                <td className="py-3 pr-3"><span className="text-white">{r.shopName}</span><span className="block text-xs text-ash">{r.owner}</span></td>
                <td className="py-3 pr-3 font-mono text-bone">{r.delivered}</td>
                <td className="py-3 pr-3 font-mono text-bone">{formatPrice(r.revenue)}</td>
                <td className="py-3 pr-3 text-bone">{r.rating ? `${r.rating}/5 (${r.reviews})` : "—"}</td>
                <td className={`py-3 pr-3 font-mono ${r.disputes ? "text-alarm" : "text-bone"}`}>{r.disputes}</td>
                <td className="py-3 text-right">
                  {!winner && (
                    <button className="btn px-3 py-1.5 text-xs" onClick={() => setOpenRow(openRow === r.shopId ? null : r.shopId)}>{openRow === r.shopId ? "Fermer" : "Récompenser"}</button>
                  )}
                  {openRow === r.shopId && (
                    <div className="text-left">
                      <GrantForm kind={kind} defaultMonths={defaultFreeMonths[kind]} pending={pending} onSubmit={(v) => grant(r.shopId, r.shopName, kind, v)} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line pt-6">
        <h3 className="font-medium text-white">Offrir des mois à une boutique</h3>
        <p className="mt-1 text-sm text-ash">En dehors des classements : geste commercial, compensation, fidélité…</p>
        <select className="input mt-4 max-w-sm" value={giftShop} onChange={(e) => setGiftShop(e.target.value)} aria-label="Boutique">
          <option value="">Choisir une boutique…</option>
          {eligible.map((s) => <option key={s.id} value={s.id}>{s.shopName}</option>)}
        </select>
        {giftShop && (
          <GrantForm kind="gift" withTitle defaultMonths={1} pending={pending} onSubmit={(v) => grant(giftShop, eligible.find((s) => s.id === giftShop)?.shopName ?? "", "gift", v)} />
        )}
      </div>

      {rewards.length > 0 && (
        <div className="border-t border-line pt-6">
          <h3 className="mb-3 font-medium text-white">Historique</h3>
          <ul className="divide-y divide-line text-sm" data-reveal suppressHydrationWarning>
            {rewards.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${r.revoked ? "opacity-50" : ""}`}>
                <span>
                  <span className="text-white">{r.title}</span> · <span className="text-bone">{r.shopName}</span>
                  <span className="block font-mono text-xs text-ash">
                    {r.freeMonths ? `${r.freeMonths} mois offert${r.freeMonths > 1 ? "s" : ""} · ${shortDate(r.startsOn!)} → ${shortDate(r.endsOn!)}` : "sans mois offert"}
                    {r.revoked ? " · retirée" : ""}
                  </span>
                </span>
                {!r.revoked && <button className="text-xs text-alarm hover:underline" disabled={pending} onClick={() => revoke(r)}>Retirer</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

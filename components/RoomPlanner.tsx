"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FABRICS, FURNITURE, type FurnitureType } from "@/lib/furniture";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { PaymentMethodId } from "@/lib/payments";
import { toast } from "@/lib/toast";

export type PlannerProduct = {
  slug: string; name: string; price: number; image?: string; typeId: string | null;
  shop: { slug: string; name: string; city: string; payments: PaymentMethodId[] };
  rating: { average: number; count: number };
};
export type RoomPhoto = { url: string; label: string };

type Placed = { key: string; typeId: string; slug?: string; x: number; y: number; w: number; flip: boolean; color: string };
type Room = { id: string; label: string; photo?: string };

const ROOMS: Room[] = [
  { id: "salon", label: "Salon" },
  { id: "chambre", label: "Chambre" },
  { id: "salle", label: "Salle à manger" },
];
const WALLS = ["#f3ede4", "#e8eef3", "#f5e6da", "#e9efe6", "#ece8f6"];
const SAVE = "nx-room-v1";
const uid = () => Math.random().toString(36).slice(2, 9);
const typeById = (id: string) => FURNITURE.find((f) => f.id === id)!;

/** Pièce vide dessinée : mur, fenêtre, plinthe et sol en perspective. */
function EmptyRoom({ kind, wall }: { kind: string; wall: string }) {
  const floor = kind === "chambre" ? "#c89f74" : kind === "salle" ? "#d8d2c8" : "#b98b5e";
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <rect width="800" height="330" fill={wall} />
      <rect x={kind === "chambre" ? 90 : 520} y="60" width="190" height="170" rx="6" fill="#cfe6f5" stroke="#fff" strokeWidth="10" />
      <path d={`M${kind === "chambre" ? 185 : 615} 60 v170`} stroke="#fff" strokeWidth="6" />
      <rect x={kind === "chambre" ? 70 : 500} y="232" width="230" height="10" rx="3" fill="#fff" opacity=".9" />
      <rect y="322" width="800" height="12" fill="#fff" opacity=".85" />
      <path d="M0 334 H800 V500 H0z" fill={floor} />
      {kind === "salle"
        ? Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 100} 334 L${i * 140 - 160} 500`} stroke="#000" strokeOpacity=".07" strokeWidth="2" />)
        : Array.from({ length: 7 }, (_, i) => <path key={i} d={`M0 ${350 + i * 24} H800`} stroke="#000" strokeOpacity=".06" strokeWidth="2" />)}
    </svg>
  );
}

export function RoomPlanner({ products, photos = [] }: { products: PlannerProduct[]; photos?: RoomPhoto[] }) {
  const rooms: Room[] = [...photos.map((p, i) => ({ id: `photo-${i}`, label: p.label, photo: p.url })), ...ROOMS];
  const [room, setRoom] = useState<Room>(rooms[0]);
  const [upload, setUpload] = useState<string | null>(null);
  const [wall, setWall] = useState(WALLS[0]);
  const [items, setItems] = useState<Placed[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<"vendeurs" | "idees">(products.length ? "vendeurs" : "idees");
  const [step, setStep] = useState<"plan" | "devis">("plan");
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ key: string; dx: number; dy: number } | null>(null);
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  // Agencement gardé sur l'appareil (pas pour une photo envoyée, qui ne quitte jamais le téléphone).
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE) ?? "null");
      if (s && Array.isArray(s.items) && !photos.length) { setItems(s.items.filter((i: Placed) => FURNITURE.some((f) => f.id === i.typeId))); if (s.wall) setWall(s.wall); const r = ROOMS.find((x) => x.id === s.room); if (r) setRoom(r); }
    } catch { /* stockage indisponible */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(SAVE, JSON.stringify({ items, wall, room: room.id })); } catch { /* idem */ }
  }, [items, wall, room]);

  function add(f: FurnitureType, slug?: string) {
    const key = uid();
    setItems((l) => [...l, { key, typeId: f.id, slug, x: 50 + (l.length % 5) * 4 - 8, y: f.floor ? 86 : 42, w: f.width, flip: false, color: FABRICS[l.length % FABRICS.length] }]);
    setSel(key);
  }
  const patch = (key: string, p: Partial<Placed>) => setItems((l) => l.map((i) => (i.key === key ? { ...i, ...p } : i)));
  const selected = items.find((i) => i.key === sel) ?? null;

  function down(e: React.PointerEvent, it: Placed) {
    e.preventDefault();
    const r = stage.current!.getBoundingClientRect();
    drag.current = { key: it.key, dx: ((e.clientX - r.left) / r.width) * 100 - it.x, dy: ((e.clientY - r.top) / r.height) * 100 - it.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSel(it.key);
    // Le meuble touché passe devant les autres.
    setItems((l) => [...l.filter((i) => i.key !== it.key), it]);
  }
  function move(e: React.PointerEvent) {
    if (!drag.current) return;
    const r = stage.current!.getBoundingClientRect();
    const x = Math.min(98, Math.max(2, ((e.clientX - r.left) / r.width) * 100 - drag.current.dx));
    const y = Math.min(100, Math.max(8, ((e.clientY - r.top) / r.height) * 100 - drag.current.dy));
    patch(drag.current.key, { x, y });
  }
  const up = () => { drag.current = null; };

  function onKey(e: React.KeyboardEvent, it: Placed) {
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, Partial<Placed>> = { ArrowLeft: { x: it.x - step }, ArrowRight: { x: it.x + step }, ArrowUp: { y: it.y - step }, ArrowDown: { y: it.y + step } };
    if (moves[e.key]) { e.preventDefault(); patch(it.key, moves[e.key]); }
    if (e.key === "Delete" || e.key === "Backspace") { setItems((l) => l.filter((i) => i.key !== it.key)); setSel(null); }
  }

  // ------------------------------------------------------------------ devis
  const best = (typeId: string) =>
    products.filter((p) => p.typeId === typeId).sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count || a.price - b.price)[0];
  const lines = useMemo(() => {
    const map = new Map<string, { product?: PlannerProduct; type: FurnitureType; qty: number; suggested: boolean }>();
    for (const it of items) {
      const chosen = it.slug ? bySlug.get(it.slug) : undefined;
      const product = chosen ?? best(it.typeId);
      const k = product ? product.slug : `type:${it.typeId}`;
      const cur = map.get(k);
      if (cur) cur.qty++;
      else map.set(k, { product, type: typeById(it.typeId), qty: 1, suggested: !chosen && !!product });
    }
    return [...map.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, bySlug]);
  const byShop = useMemo(() => {
    const m = new Map<string, { shop: PlannerProduct["shop"]; rating: number; lines: typeof lines }>();
    for (const l of lines) if (l.product) {
      const g = m.get(l.product.shop.slug) ?? { shop: l.product.shop, rating: 0, lines: [] };
      g.lines.push(l);
      m.set(l.product.shop.slug, g);
    }
    return [...m.values()];
  }, [lines]);
  const missing = lines.filter((l) => !l.product);
  const total = lines.reduce((s, l) => s + (l.product ? l.product.price * l.qty : 0), 0);
  const topShops = useMemo(() => {
    const m = new Map<string, { shop: PlannerProduct["shop"]; sum: number; n: number; top: PlannerProduct }>();
    for (const p of products) {
      const g = m.get(p.shop.slug) ?? { shop: p.shop, sum: 0, n: 0, top: p };
      g.sum += p.rating.average * p.rating.count;
      g.n += p.rating.count;
      if (p.rating.average > g.top.rating.average || (p.rating.average === g.top.rating.average && p.rating.count > g.top.rating.count)) g.top = p;
      m.set(p.shop.slug, g);
    }
    return [...m.values()].map((g) => ({ ...g, avg: g.n ? g.sum / g.n : 0 })).sort((a, b) => b.avg - a.avg || b.n - a.n).slice(0, 3);
  }, [products]);
  const ref = useMemo(() => `DV-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${uid().slice(0, 4).toUpperCase()}`, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const quoteText = () => [
    `Devis NEXORA ${ref}`,
    ...lines.map((l) => (l.product ? `• ${l.qty} × ${l.product.name} (${l.product.shop.name}) : ${formatPrice(l.product.price * l.qty)}` : `• ${l.qty} × ${l.type.name} : vendeur à trouver`)),
    `Total : ${formatPrice(total)}`,
  ].join("\n");
  function addAll() {
    let n = 0;
    for (const l of lines) if (l.product) { addToCart({ slug: l.product.slug, name: l.product.name, price: l.product.price, shopName: l.product.shop.name, payments: l.product.shop.payments, image: l.product.image }, l.qty); n++; }
    toast(n ? "Meubles ajoutés au panier" : "Aucun meuble disponible à la vente pour l'instant", n ? "ok" : "error");
  }

  // ------------------------------------------------------------------ rendu
  const bg = upload ?? room.photo;
  const tile = (f: FurnitureType, color: string) => <span className="block h-full w-full [&>svg]:h-full [&>svg]:w-full">{f.draw(color)}</span>;

  if (step === "devis") {
    return (
      <div className="space-y-8 print:space-y-4" aria-live="polite">
        <div className="card space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Devis</p>
              <h2 className="mt-1 text-2xl font-medium text-white">Votre pièce aménagée</h2>
              <p className="mt-1 font-mono text-xs text-iron">{ref} · {new Date().toLocaleDateString("fr-FR")} · valable 15 jours, selon le stock des vendeurs</p>
            </div>
            <button type="button" className="btn print:hidden" onClick={() => setStep("plan")}>← Modifier la pièce</button>
          </div>
          {byShop.map((g) => (
            <div key={g.shop.slug} className="rounded-[18px] border border-line p-4">
              <p className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/boutiques/${g.shop.slug}`} className="font-medium text-white hover:underline">{g.shop.name} <span className="text-pulse">✓</span></Link>
                <span className="text-xs text-ash">{g.shop.city}</span>
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {g.lines.map((l) => (
                  <li key={l.product!.slug} className="flex justify-between gap-3">
                    <span className="min-w-0 text-bone">
                      {l.qty} × <Link href={`/produits/${l.product!.slug}`} className="underline-offset-4 hover:underline">{l.product!.name}</Link>
                      {l.suggested && <span className="ml-2 whitespace-nowrap rounded-full bg-[#eef0ff] px-2 py-0.5 text-[11px] text-iris" title={`Meilleur vendeur pour « ${l.type.name} »`}>conseillé</span>}
                    </span>
                    <span className="shrink-0 font-mono text-white">{formatPrice(l.product!.price * l.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {missing.length > 0 && (
            <div className="rounded-[18px] bg-[#fff6e5] p-4 text-sm text-[#8a5a00]">
              <p className="font-medium">Pas encore en vente sur NEXORA :</p>
              <p className="mt-1">{missing.map((l) => `${l.qty} × ${l.type.name}`).join(", ")}. Notre service client peut vous trouver un vendeur.</p>
              <Link href="/support" className="mt-2 inline-block underline underline-offset-4 print:hidden">Demander au service client</Link>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="text-ash">Total {missing.length > 0 && <span className="text-xs">(hors meubles à trouver)</span>}</span>
            <span className="whitespace-nowrap font-mono text-2xl text-white">{formatPrice(total)}</span>
          </div>
          <p className="text-xs text-iron">Livraison et montage à convenir avec chaque vendeur. Vous payez chaque vendeur directement (Orange Money, Wave, carte ou à la livraison).</p>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" className="btn-solid" data-haptic onClick={addAll} disabled={!byShop.length}>Ajouter au panier</button>
            <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(quoteText())}`} target="_blank" rel="noopener noreferrer">Envoyer par WhatsApp</a>
            <button type="button" className="btn" onClick={() => window.print()}>Imprimer / PDF</button>
          </div>
        </div>

        {topShops.length > 0 && (
          <section className="card print:hidden" aria-labelledby="top-vendeurs">
            <h2 id="top-vendeurs" className="text-xl font-medium text-white">Les meilleurs vendeurs de meubles</h2>
            <p className="mt-1 text-sm text-ash">Classés par les avis vérifiés de leurs clients.</p>
            <ol className="mt-5 grid gap-3 md:grid-cols-3">
              {topShops.map((g, i) => (
                <li key={g.shop.slug} className="rounded-[18px] border border-line p-4">
                  <p className="font-mono text-xs text-iron">n° {i + 1}</p>
                  <Link href={`/boutiques/${g.shop.slug}`} className="mt-1 block font-medium text-white hover:underline">{g.shop.name}</Link>
                  <p className="text-xs text-ash">{g.shop.city} · {g.n ? `${g.avg.toFixed(1)}/5 sur ${g.n} avis` : "nouveau vendeur"}</p>
                  <p className="mt-3 text-xs text-iron">Son meilleur produit</p>
                  <Link href={`/produits/${g.top.slug}`} className="text-sm text-bone hover:underline">{g.top.name}</Link>
                  <p className="font-mono text-sm text-white">{formatPrice(g.top.price)}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {/* Choix de la pièce */}
        <div className="flex flex-wrap items-center gap-2">
          {rooms.map((r) => (
            <button key={r.id} type="button" onClick={() => { setRoom(r); setUpload(null); }} aria-pressed={!upload && room.id === r.id}
              className={`pill ${!upload && room.id === r.id ? "border-white text-white" : "text-ash hover:text-white"}`}>{r.label}</button>
          ))}
          <label className={`pill cursor-pointer ${upload ? "border-white text-white" : "text-ash hover:text-white"}`}>
            📷 Ma pièce (photo)
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUpload(URL.createObjectURL(f)); }} />
          </label>
        </div>

        <div ref={stage} className="room-stage" onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          onPointerDown={(e) => { if (e.target === e.currentTarget || (e.target as Element).closest("[data-room-bg]")) setSel(null); }}>
          <div data-room-bg className="absolute inset-0">
            {bg
              // eslint-disable-next-line @next/next/no-img-element -- photo locale ou photo du bien
              ? <img src={bg} alt="" className="h-full w-full object-cover" />
              : <EmptyRoom kind={room.id} wall={wall} />}
          </div>
          {items.map((it) => {
            const f = typeById(it.typeId);
            const p = it.slug ? bySlug.get(it.slug) : undefined;
            return (
              <button key={it.key} type="button" className={`room-item ${sel === it.key ? "is-sel" : ""}`}
                style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, aspectRatio: p?.image ? "1" : `1 / ${f.ratio}`, transform: `translate(-50%, -100%) scaleX(${it.flip ? -1 : 1})` }}
                aria-label={`${p?.name ?? f.name} : glissez pour déplacer, flèches du clavier pour ajuster, Suppr pour retirer`}
                onPointerDown={(e) => down(e, it)} onKeyDown={(e) => onKey(e, it)} onFocus={() => setSel(it.key)}>
                {p?.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.image} alt="" draggable={false} className="h-full w-full object-contain mix-blend-multiply" />
                  : tile(f, it.color)}
              </button>
            );
          })}
          {!items.length && (
            <p className="pointer-events-none absolute left-1/2 top-6 w-[86%] -translate-x-1/2 rounded-full bg-[#ffffff]/85 px-4 py-2 text-center text-sm text-[#0b0b0f] backdrop-blur">
              Touchez un meuble à droite pour le poser, puis glissez-le où vous voulez.
            </p>
          )}
        </div>

        {/* Réglages du meuble choisi */}
        {selected ? (
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-medium text-white">{bySlug.get(selected.slug ?? "")?.name ?? typeById(selected.typeId).name}</span>
            <label className="flex items-center gap-2 text-sm text-ash">Taille
              <input type="range" min={5} max={90} value={selected.w} onChange={(e) => patch(selected.key, { w: Number(e.target.value) })} className="accent-[#5433eb]" />
            </label>
            {!selected.slug && (
              <span className="flex gap-1.5" role="group" aria-label="Couleur">
                {FABRICS.map((c) => <button key={c} type="button" aria-label={`Couleur ${c}`} aria-pressed={selected.color === c} onClick={() => patch(selected.key, { color: c })} className={`h-6 w-6 rounded-full border-2 ${selected.color === c ? "border-[#0b0b0f]" : "border-transparent"}`} style={{ background: c }} />)}
              </span>
            )}
            <button type="button" className="btn px-3 py-1.5 text-xs" onClick={() => patch(selected.key, { flip: !selected.flip })}>Retourner</button>
            <button type="button" className="btn px-3 py-1.5 text-xs" onClick={() => { const k = uid(); setItems((l) => [...l, { ...selected, key: k, x: Math.min(96, selected.x + 6) }]); setSel(k); }}>Dupliquer</button>
            <button type="button" className="btn-danger px-3 py-1.5 text-xs" onClick={() => { setItems((l) => l.filter((i) => i.key !== selected.key)); setSel(null); }}>Retirer</button>
          </div>
        ) : !bg && (
          <div className="flex items-center gap-2 text-sm text-ash" role="group" aria-label="Couleur des murs">
            Murs :
            {WALLS.map((c) => <button key={c} type="button" aria-label={`Mur ${c}`} aria-pressed={wall === c} onClick={() => setWall(c)} className={`h-7 w-7 rounded-full border-2 ${wall === c ? "border-[#5433eb]" : "border-line"}`} style={{ background: c }} />)}
          </div>
        )}
      </div>

      {/* Catalogue de meubles */}
      <aside className="card flex flex-col gap-4 p-4 lg:sticky lg:top-24 lg:self-start">
        <div className="auth-tabs" role="tablist" aria-label="Meubles">
          <button type="button" role="tab" aria-selected={tab === "vendeurs"} onClick={() => setTab("vendeurs")}>Des vendeurs</button>
          <button type="button" role="tab" aria-selected={tab === "idees"} onClick={() => setTab("idees")}>Idées</button>
        </div>
        {tab === "vendeurs" ? (
          products.length ? (
            <ul className="grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
              {products.map((p) => {
                const f = p.typeId ? typeById(p.typeId) : FURNITURE[0];
                return (
                  <li key={p.slug}>
                    <button type="button" className="room-pick" onClick={() => add(f, p.slug)} data-haptic>
                      <span className="room-pick-img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain" /> : tile(f, FABRICS[0])}
                      </span>
                      <span className="line-clamp-2 text-xs text-white">{p.name}</span>
                      <span className="font-mono text-[11px] text-ash">{formatPrice(p.price)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-ash">Les vendeurs de meubles arrivent bientôt. Essayez l&apos;onglet « Idées » : le devis vous proposera les vendeurs dès qu&apos;ils seront là.</p>
        ) : (
          <ul className="grid max-h-[46vh] grid-cols-3 gap-2 overflow-y-auto pr-1">
            {FURNITURE.map((f) => (
              <li key={f.id}>
                <button type="button" className="room-pick" onClick={() => add(f)} data-haptic>
                  <span className="room-pick-img p-2">{tile(f, FABRICS[0])}</span>
                  <span className="text-[11px] leading-tight text-white">{f.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-line pt-4">
          <p className="mb-3 flex justify-between text-sm"><span className="text-ash">{items.length} meuble{items.length > 1 ? "s" : ""}</span><span className="font-mono text-white">{formatPrice(total)}</span></p>
          <button type="button" className="btn-solid w-full" data-haptic disabled={!items.length} onClick={() => { setSel(null); setStep("devis"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            Confirmer et voir le devis
          </button>
          {items.length > 0 && <button type="button" className="mt-2 w-full text-xs text-ash hover:text-white" onClick={() => { setItems([]); setSel(null); }}>Vider la pièce</button>}
        </div>
      </aside>
    </div>
  );
}

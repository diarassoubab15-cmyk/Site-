"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { CountUp } from "./CountUp";

/**
 * Présentation animée d'un produit (forfait Ultra), en motion design : 4 scènes façon « stories »,
 * construites à partir des vraies photos et des informations du vendeur (aucune IA, aucune 3D).
 * - ne joue que lorsqu'elle est visible, s'arrête sinon ;
 * - toucher à gauche / à droite : scène précédente / suivante ; bouton Pause ; flèches du clavier ;
 * - mouvement réduit : pas de lecture automatique ni d'effets, on avance à la main.
 */
export type ShowcaseData = {
  name: string;
  short?: string;
  images: string[];
  specs: [string, string][];
  price: number;
  unit?: string;
  wholesale?: { minQty: number; price: number };
  shopName: string;
  cod: boolean;
  color: string;
};

const SCENES = ["Présentation", "Détails", "Prix", "Commander"] as const;
const DURATION = 2600;

export function ProductShowcase({ d }: { d: ShowcaseData }) {
  const box = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [round, setRound] = useState(0);   // relance les animations de la scène
  const img = (i: number) => d.images[i % d.images.length];

  useEffect(() => {
    setReduce(matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && e.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = visible && !paused && !reduce;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => go(scene + 1), scene === SCENES.length - 1 ? DURATION + 1400 : DURATION);
    return () => clearTimeout(t);
    // go dépend de scene seulement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, scene, round]);

  function go(i: number) {
    setScene(((i % SCENES.length) + SCENES.length) % SCENES.length);
    setRound((r) => r + 1);
  }

  const specs = d.specs.slice(0, 3);
  const words = d.name.split(/\s+/);

  return (
    <section aria-label={`Présentation animée : ${d.name}`} className="space-y-2">
      <div
        ref={box}
        className={`showcase ${reduce ? "is-static" : ""}`}
        style={{ ["--c" as string]: d.color }}
        tabIndex={0}
        role="group"
        aria-roledescription="présentation"
        aria-label={`Scène ${scene + 1} sur ${SCENES.length} : ${SCENES[scene]}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(scene + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(scene - 1); }
        }}
        data-showcase={scene}
      >
        {/* Progression façon stories */}
        <div className="showcase-bars" aria-hidden="true">
          {SCENES.map((s, i) => (
            <span key={s} className="showcase-bar">
              <span key={`${round}-${i}`} className={i < scene ? "is-done" : i === scene ? (playing ? "is-run" : "is-hold") : ""} style={{ animationDuration: `${i === SCENES.length - 1 ? DURATION + 1400 : DURATION}ms` }} />
            </span>
          ))}
        </div>

        <div key={`${scene}-${round}`} className="showcase-scene">
          {scene === 0 && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(0)} alt="" className="showcase-photo sc-kenburns" />
              <div className="showcase-shade" />
              <div className="showcase-text">
                <p className="sc-fade text-xs" style={{ color: d.color }}>{d.shopName}</p>
                <h3 className="showcase-title">
                  {words.map((w, i) => (
                    <Fragment key={i}><span className="sc-word-mask"><span className="sc-word" style={{ animationDelay: `${150 + i * 70}ms` }}>{w}</span></span>{" "}</Fragment>
                  ))}
                </h3>
                {d.short && <p className="sc-fade mt-2 max-w-sm text-sm text-bone" style={{ animationDelay: "500ms" }}>{d.short}</p>}
              </div>
            </>
          )}
          {scene === 1 && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(1)} alt="" className="showcase-photo sc-slide" />
              <div className="showcase-shade" />
              <ul className="showcase-text space-y-2">
                {(specs.length ? specs : [["Vendeur vérifié", "par NEXORA"] as [string, string]]).map(([k, v], i) => (
                  <li key={k} className="sc-chip" style={{ animationDelay: `${120 + i * 110}ms` }}>
                    <span className="text-ash">{k}</span> <span className="text-white">{v}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {scene === 2 && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(2)} alt="" className="showcase-photo sc-zoom" />
              <div className="showcase-shade" />
              <div className="showcase-text">
                <p className="sc-fade text-sm text-bone">Prix</p>
                <p className="showcase-price">{reduce ? d.price.toLocaleString("fr-FR") : <CountUp value={d.price} format={(n) => n.toLocaleString("fr-FR")} />} <span className="text-lg">FCFA{d.unit ? ` / ${d.unit}` : ""}</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.wholesale && <span className="sc-chip" style={{ animationDelay: "500ms" }}>Dès {d.wholesale.minQty} : {d.wholesale.price.toLocaleString("fr-FR")} FCFA</span>}
                  {d.cod && <span className="sc-chip" style={{ animationDelay: "620ms" }}>Paiement à la livraison</span>}
                </div>
              </div>
            </>
          )}
          {scene === 3 && (
            <>
              <div className="showcase-mosaic">
                {[0, 1, 2, 3].map((i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img(i)} alt="" className="sc-tile" style={{ animationDelay: `${i * 90}ms` }} />
                ))}
              </div>
              <div className="showcase-shade" />
              <div className="showcase-text">
                <p className="showcase-title sc-fade">{d.name}</p>
                <a href="#achat" className="tryon-cta sc-fade mt-4 inline-flex w-auto px-5" style={{ animationDelay: "380ms" }}>Commander</a>
              </div>
            </>
          )}
        </div>

        {/* Zones de toucher : gauche = précédent, droite = suivant */}
        <button type="button" className="showcase-tap left-0" aria-label="Scène précédente" onClick={() => go(scene - 1)} />
        <button type="button" className="showcase-tap right-0" aria-label="Scène suivante" onClick={() => go(scene + 1)} />
      </div>
      <div className="flex items-center justify-between text-xs text-ash">
        <span>Présentation animée · {SCENES[scene]}</span>
        {!reduce && (
          <button type="button" className="hover:text-white" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? "Lecture" : "Pause"}</button>
        )}
      </div>
    </section>
  );
}

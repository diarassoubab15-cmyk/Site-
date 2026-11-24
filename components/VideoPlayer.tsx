"use client";
import { useEffect, useRef, useState } from "react";

type NavigatorExtra = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

/**
 * Lecteur léger pour les vidéos HyperFrames (sans son) :
 * - rien n'est téléchargé avant que la vidéo soit visible (preload="none") ;
 * - lecture automatique en boucle seulement si visible, et pause hors écran ;
 * - économie de données, connexion 2G/3G ou mouvement réduit : image de couverture + bouton lecture.
 */
export function VideoPlayer({ src, poster, label, className = "" }: { src: string; poster: string; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [manual, setManual] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const n = navigator as NavigatorExtra;
    const frugal = document.documentElement.hasAttribute("data-lite") || !!n.connection?.saveData || /(^|-)2g|3g/.test(n.connection?.effectiveType ?? "") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (frugal) {
      setManual(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().then(() => setPlaying(true)).catch(() => setManual(true));
        else {
          v.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {});
    else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-[16px] border border-line bg-black ${className}`}>
      <video ref={ref} className="block aspect-video w-full" src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} onClick={toggle} />
      {(manual || !playing) && (
        <button type="button" onClick={toggle} className="absolute inset-0 flex items-center justify-center bg-black/20" aria-label={`Lire la vidéo : ${label}`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/60 backdrop-blur-[25px]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}

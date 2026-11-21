"use client";
import { useState } from "react";

/**
 * Carte Google Maps d'une boutique physique : rien n'est chargé chez Google tant que le visiteur
 * n'a pas demandé la carte (vie privée et données mobiles).
 */
export function ShopMap({ embed, link, label }: { embed: string; link?: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Masquer la carte" : "Voir sur la carte"}</button>
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="btn">Itinéraire Google Maps</a>}
      </div>
      {open && (
        <iframe
          title={`Carte : ${label}`}
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="pop h-72 w-full rounded-[14px] border border-line"
        />
      )}
    </div>
  );
}

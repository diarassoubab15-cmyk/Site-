"use client";
import { useEffect, useRef } from "react";

/**
 * Fenêtres plein écran (essayage, visite 360°, rotation, zoom photo) accessibles au clavier et au lecteur d'écran :
 * - à l'ouverture, le focus entre dans la fenêtre (premier bouton) ;
 * - le reste de la page devient inerte (ni Tab ni lecteur d'écran ne s'y échappent) ;
 * - à la fermeture, le focus revient sur le bouton qui l'avait ouverte.
 */
export function useDialog<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const others = [...document.body.children].filter((el) => el !== dialog && !el.contains(dialog!)) as HTMLElement[];
    others.forEach((el) => el.setAttribute("inert", ""));
    const first = dialog?.querySelector<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])");
    (first ?? dialog)?.focus();
    return () => {
      others.forEach((el) => el.removeAttribute("inert"));
      trigger?.focus?.();
    };
  }, [open]);
  return ref;
}

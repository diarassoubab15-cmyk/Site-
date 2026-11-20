"use client";
import { useEffect, useState } from "react";
import { supabaseEnabled } from "./supabase/env";
import { getBuyerContext } from "@/app/actions";

type Ctx = Awaited<ReturnType<typeof getBuyerContext>>;
const cache = new Map<string, Promise<Ctx>>();

/** Contexte acheteur partagé par la commande et les avis (un seul appel par page). */
export function useBuyerContext(slug: string) {
  const [ctx, setCtx] = useState<(Ctx & { loaded: boolean }) | null>(supabaseEnabled ? null : { loaded: true, loggedIn: false, known: null, reviewableOrderId: null });
  useEffect(() => {
    if (!supabaseEnabled) return;
    // La mémoire ne sert qu'à partager UN appel entre la commande et les avis affichés ensemble ;
    // elle est vidée aussitôt, pour qu'une connexion ou une commande soit prise en compte.
    if (!cache.has(slug)) {
      const pending = getBuyerContext(slug);
      cache.set(slug, pending);
      pending.finally(() => cache.delete(slug));
    }
    let alive = true;
    cache.get(slug)!.then((c) => alive && setCtx({ ...c, loaded: true }));
    return () => {
      alive = false;
    };
  }, [slug]);
  return ctx ?? { loaded: false, loggedIn: false, known: null, reviewableOrderId: null };
}
export const refreshBuyerContext = (slug: string) => cache.delete(slug);

"use client";
import { useEffect } from "react";

type W = Window & { fbq?: ((...a: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown }; _fbq?: unknown; ttq?: { load: (id: string) => void; page: () => void; track: (e: string, d?: object) => void } & unknown[]; TiktokAnalyticsObject?: string };

/**
 * Pixels publicitaires d'une boutique Pro ou Ultra (Facebook, TikTok), chargés UNIQUEMENT sur ses pages,
 * pour mesurer ses publicités. Désactivés en mode « économie de données ».
 */
export function ShopPixels({ fb, tiktok, product }: { fb?: string | null; tiktok?: string | null; product?: { id: string; name: string; price: number } }) {
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-lite")) return;
    const w = window as W;
    if (fb && /^[0-9]{6,20}$/.test(fb)) {
      if (!w.fbq) {
        const q: W["fbq"] = Object.assign((...a: unknown[]) => { (q!.queue ??= []).push(a); }, { queue: [] as unknown[], loaded: true, version: "2.0" });
        w.fbq = q; w._fbq = q;
        const s = document.createElement("script"); s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js"; document.head.appendChild(s);
      }
      w.fbq!("init", fb);
      w.fbq!("track", "PageView");
      if (product) w.fbq!("track", "ViewContent", { content_ids: [product.id], content_name: product.name, value: product.price, currency: "XOF" });
    }
    if (tiktok && /^[A-Z0-9]{10,30}$/.test(tiktok)) {
      const s = document.createElement("script"); s.async = true;
      s.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${tiktok}&lib=ttq`;
      s.onload = () => { try { w.ttq?.page(); if (product) w.ttq?.track("ViewContent", { content_id: product.id, content_name: product.name, value: product.price, currency: "XOF" }); } catch { /* pixel indisponible */ } };
      document.head.appendChild(s);
    }
  }, [fb, tiktok, product]);
  return null;
}

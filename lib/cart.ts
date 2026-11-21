"use client";
import { useSyncExternalStore } from "react";
import type { PaymentMethodId } from "./payments";

/**
 * Panier de l'acheteur, gardé sur son appareil (localStorage) : il survit à la fermeture de la page,
 * sans compte ni serveur. Les prix affichés sont indicatifs : la base recalcule toujours le total de chaque commande.
 */
export type CartItem = {
  slug: string;
  name: string;
  price: number;
  qty: number;
  shopName: string;
  /** Moyens de paiement acceptés par la boutique (pour proposer le bon au moment de commander). */
  payments: PaymentMethodId[];
  image?: string;
};

const KEY = "nx-cart";
const MAX_ITEMS = 30;
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(raw)) items = raw.filter((i) => i && typeof i.slug === "string" && Number.isInteger(i.qty) && i.qty > 0).slice(0, MAX_ITEMS);
  } catch { items = []; }
  // Un autre onglet a modifié le panier : on se met à jour.
  window.addEventListener("storage", (e) => { if (e.key === KEY) { loaded = false; load(); emit(); } });
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* stockage indisponible (navigation privée) : panier gardé pour la session */ }
  emit();
}
function emit() { listeners.forEach((l) => l()); }

const EMPTY: CartItem[] = [];
export function useCart(): CartItem[] {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return items; },
    () => EMPTY,
  );
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  load();
  const found = items.find((i) => i.slug === item.slug);
  items = found
    ? items.map((i) => (i.slug === item.slug ? { ...i, ...item, qty: Math.min(10000, i.qty + qty) } : i))
    : [...items, { ...item, qty }].slice(-MAX_ITEMS);
  save();
}
export function setCartQty(slug: string, qty: number) {
  load();
  items = qty <= 0 ? items.filter((i) => i.slug !== slug) : items.map((i) => (i.slug === slug ? { ...i, qty: Math.min(10000, qty) } : i));
  save();
}
export function removeFromCart(slug: string) { setCartQty(slug, 0); }
export function clearCart(slugs?: string[]) {
  load();
  items = slugs ? items.filter((i) => !slugs.includes(i.slug)) : [];
  save();
}

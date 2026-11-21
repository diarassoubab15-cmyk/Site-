"use client";
/**
 * Stockage de démonstration (localStorage du navigateur).
 * Il imite les tables Supabase pour que tous les parcours soient testables
 * avant le branchement de la vraie base. À remplacer par des appels Supabase.
 */
import { useSyncExternalStore } from "react";
import type { PaymentMethodId } from "./payments";

export type OrderStatus = "en attente de paiement" | "confirmée" | "expédiée" | "livrée" | "non reçue" | "remboursée" | "annulée";
export type DemoOrder = {
  id: string; // référence affichée (NX-…)
  uuid?: string; // identifiant en base (mode Supabase)
  product: string;
  productName: string;
  shop: string;
  qty: number;
  total: number;
  method: PaymentMethodId;
  status: OrderStatus;
  createdAt: string;
};
export type DemoReview = { id: string; product: string; author: string; rating: number; title: string; body: string; date: string };
export type SellerStatus = "en attente" | "autorisé" | "suspendu" | "refusé" | "fermé";
export type DemoSeller = { id: string; shopName: string; owner: string; email: string; phone: string; city: string; country: string; category: string; status: SellerStatus; createdAt: string };
export type PayoutAccount = { id: string; type: PaymentMethodId | "bank"; label: string; masked: string };
export type Ticket = {
  id: string;
  kind: "contact" | "signalement" | "remboursement";
  subject: string;
  message: string;
  orderId?: string;
  orderUuid?: string;
  shop?: string;
  status: "ouvert" | "en cours" | "résolu";
  createdAt: string;
};
/** Paiement d'abonnement : contact de l'admin obligatoire avant de payer. */
export type SubPaymentStatus = "contact" | "paiement" | "déclaré" | "confirmé" | "refusé";
export type DemoSubPayment = {
  id: string;
  ref: string;
  shopId: string;
  shopName?: string;
  owner?: string;
  ownerPhone?: string;
  plan: string;
  annual: boolean;
  amount: number;
  status: SubPaymentStatus;
  operatorRef?: string;
  payerPhone?: string;
  adminNote?: string;
  createdAt: string;
};
export type Profile = { name: string; email: string; phone: string; city: string; country: string };
export type NotificationPrefs = {
  orderUpdates: boolean;
  deliveryUpdates: boolean;
  reviewRequest: boolean;
  promotions: boolean;
  newsletter: boolean;
  sellerNewOrder: boolean;
  sellerWeeklySummary: boolean;
};

export type DemoState = {
  profile: Profile | null;
  orders: DemoOrder[];
  reviews: DemoReview[];
  sellers: DemoSeller[];
  payouts: PayoutAccount[];
  tickets: Ticket[];
  prefs: NotificationPrefs;
  myShopId: string | null;
  subscription: { plan: string; annual: boolean; active: boolean; until?: string } | null;
  subPayments: DemoSubPayment[];
  rewards: import("./rewards").RewardView[];
  onboardingDraft: Record<string, string>;
};

const KEY = "nexora-demo-v1";

const seedSellers: DemoSeller[] = [
  { id: "s-101", shopName: "Saveurs de Lomé", owner: "Kodjo A.", email: "kodjo@example.com", phone: "+228 90 00 00 00", city: "Lomé", country: "Togo", category: "alimentation", status: "en attente", createdAt: "2026-11-15" },
  { id: "s-102", shopName: "Cotonou Sneakers", owner: "Rachidatou B.", email: "rachida@example.com", phone: "+229 97 00 00 00", city: "Cotonou", country: "Bénin", category: "mode", status: "en attente", createdAt: "2026-11-16" },
  { id: "s-001", shopName: "Atelier Kenté", owner: "Koffi A.", email: "koffi@example.com", phone: "+225 07 00 00 00", city: "Abidjan", country: "Côte d'Ivoire", category: "mode", status: "autorisé", createdAt: "2024-02-11" },
  { id: "s-002", shopName: "Dakar Tech", owner: "Ibrahima N.", email: "ibrahima@example.com", phone: "+221 77 000 00 00", city: "Dakar", country: "Sénégal", category: "electronique", status: "autorisé", createdAt: "2023-11-20" },
  { id: "s-099", shopName: "Promo Express 24", owner: "Inconnu", email: "promo24@example.com", phone: "+000", city: "—", country: "—", category: "electronique", status: "suspendu", createdAt: "2026-10-30" },
];

const initial: DemoState = {
  profile: null,
  orders: [],
  reviews: [],
  sellers: seedSellers,
  payouts: [],
  tickets: [],
  prefs: {
    orderUpdates: true,
    deliveryUpdates: true,
    reviewRequest: true,
    promotions: false, // désactivé par défaut : pas de spam
    newsletter: false,
    sellerNewOrder: true,
    sellerWeeklySummary: true,
  },
  myShopId: null,
  subscription: null,
  subPayments: [],
  rewards: [],
  onboardingDraft: {},
};

let state: DemoState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {
    /* stockage indisponible (navigation privée) : on garde l'état initial */
  }
}

export function update(fn: (s: DemoState) => DemoState) {
  load();
  state = fn(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDemo(): DemoState {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => initial,
  );
}

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
export const today = () => new Date().toISOString().slice(0, 10);

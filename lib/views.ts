/**
 * Correspondance entre les statuts de la base (anglais) et ceux affichés (français),
 * partagée par le serveur et les composants.
 */
import type { DemoOrder, DemoSeller, SellerStatus, Ticket } from "./demo-store";

export const orderStatusFr: Record<string, DemoOrder["status"]> = {
  pending_payment: "en attente de paiement",
  confirmed: "confirmée",
  shipped: "expédiée",
  delivered: "livrée",
  not_received: "non reçue",
  refunded: "remboursée",
  cancelled: "annulée",
};

export const shopStatusFr: Record<string, SellerStatus> = {
  pending: "en attente",
  approved: "autorisé",
  suspended: "suspendu",
  rejected: "refusé",
  closed: "fermé",
};
export const shopStatusDb = Object.fromEntries(Object.entries(shopStatusFr).map(([k, v]) => [v, k])) as Record<SellerStatus, "pending" | "approved" | "suspended" | "rejected" | "closed">;

export const ticketKindFr: Record<string, Ticket["kind"]> = { contact: "contact", report: "signalement", refund: "remboursement" };
export const ticketKindDb = { contact: "contact", signalement: "report", remboursement: "refund" } as const;
export const ticketStatusFr: Record<string, Ticket["status"]> = { open: "ouvert", in_progress: "en cours", resolved: "résolu" };

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; login?: boolean };

/** Données réelles passées par le serveur aux composants (mode Supabase). */
export type LiveAccount = {
  profile: { name: string; email: string; phone: string; city: string; country: string };
  orders: DemoOrder[];
  tickets: Ticket[];
  prefs: import("./demo-store").NotificationPrefs;
};

export type LiveSeller = {
  shop: { id: string; shopName: string; status: SellerStatus; plan: string | null } | null;
  payouts: { id: string; type: string; label: string; masked: string }[];
  orders: (DemoOrder & { buyer: string; city: string; phone: string })[];
  prefs: import("./demo-store").NotificationPrefs;
};

export type LiveAdmin = { sellers: DemoSeller[]; tickets: (Ticket & { shopId?: string })[] };

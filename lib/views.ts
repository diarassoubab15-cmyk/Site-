/**
 * Correspondance entre les statuts de la base (anglais) et ceux affichés (français),
 * partagée par le serveur et les composants.
 */
import type { DemoOrder, DemoSeller, DemoSubPayment, SellerStatus, SubPaymentStatus, Ticket } from "./demo-store";

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

export const subPaymentStatusFr: Record<string, SubPaymentStatus> = {
  contact_pending: "contact",
  awaiting_payment: "paiement",
  declared: "déclaré",
  confirmed: "confirmé",
  rejected: "refusé",
};

/** Vidéo de boutique, telle qu'affichée (vendeur et admin). */
export type VideoView = {
  id: string;
  ref: string;
  shopId: string;
  shopName?: string;
  description: string;
  status: "queued" | "rendering" | "review" | "approved" | "rejected" | "failed" | "cancelled";
  videoUrl: string | null;
  posterUrl: string | null;
  isActive: boolean;
  headline?: string;
  scriptSource?: string;
  adminNote?: string;
  error?: string;
  createdAt: string;
};

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; login?: boolean };

/** Données réelles passées par le serveur aux composants (mode Supabase). */
export type LiveAccount = {
  profile: { name: string; email: string; phone: string; city: string; country: string; district?: string; landmark?: string };
  orders: DemoOrder[];
  tickets: Ticket[];
  prefs: import("./demo-store").NotificationPrefs;
};

export type LiveSeller = {
  shop: { id: string; shopName: string; status: SellerStatus; plan: string | null } | null;
  payouts: { id: string; type: string; label: string; masked: string }[];
  orders: (DemoOrder & { buyer: string; city: string; phone: string })[];
  prefs: import("./demo-store").NotificationPrefs;
  subscription: { plan: string; annual: boolean; active: boolean; until: string | null } | null;
  /** Dernière demande de paiement (en cours, ou la plus récente). */
  payment: DemoSubPayment | null;
  /** Coordonnées Orange Money : envoyées par le serveur UNIQUEMENT après le contact avec l'admin. */
  payInfo: { number: string; name: string } | null;
  /** Opérateurs proposés pour payer l'abonnement (ceux dont l'admin a configuré un numéro). */
  payMethods?: ("orange_money" | "wave" | "mtn_momo" | "moov_money")[];
  owner: { name: string; phone: string };
  /** Fin de couverture : abonnement payé prolongé par les mois offerts. */
  coveredUntil: string | null;
  rewards: import("./rewards").RewardView[];
  stats: { delivered: number; revenue: number; openOrders: number; rating: number | null; reviews: number; rank: number | null; competitors: number } | null;
  videos: VideoView[];
  videoQuota: { used: number; limit: number };
  /** Ventes notées par le vendeur (WhatsApp, téléphone, boutique) et demandes WhatsApp du mois. */
  offline?: { sales: ManualSaleView[]; monthCount: number; monthAmount: number; leads: number; products: { id: string; name: string; price: number }[] };
};

export type ManualSaleView = { id: string; label: string; qty: number; amount: number; channel: "whatsapp" | "telephone" | "boutique" | "autre"; customer: string; phone: string; soldOn: string };

export type LiveAdmin = { sellers: DemoSeller[]; tickets: (Ticket & { shopId?: string })[]; payments: DemoSubPayment[]; rewards: import("./rewards").RewardView[]; videos: VideoView[]; edits: EditRequestView[] };

/** Fiche telle qu'elle peut être modifiée par une demande écrite. */
export type EditableFields = { name: string; short: string | null; description: string | null; price: number; compareAt: number | null; specs: [string, string][] };
export type EditChangesView = Partial<{ name: string; short: string; description: string; price: number; compareAt: number | null; specs: [string, string][] }>;
export type EditRequestView = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  shopName: string;
  message: string;
  status: "review" | "applied" | "rejected" | "cancelled";
  proposal: { changes: EditChangesView; note: string } | null;
  ai: boolean;
  applied: EditChangesView | null;
  adminNote: string | null;
  createdAt: string;
  current: EditableFields;
};

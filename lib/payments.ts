export type PaymentMethodId = "orange_money" | "wave" | "mtn_momo" | "moov_money" | "card" | "cash_on_delivery";

export const paymentMethods: Record<PaymentMethodId, { label: string; short: string; color: string }> = {
  orange_money: { label: "Orange Money", short: "OM", color: "#ff7900" },
  wave: { label: "Wave", short: "W", color: "#1dc8ff" },
  mtn_momo: { label: "MTN MoMo", short: "MTN", color: "#ffcc00" },
  moov_money: { label: "Moov Money", short: "MV", color: "#0066b3" },
  card: { label: "Carte bancaire", short: "CB", color: "#f0f0f0" },
  cash_on_delivery: { label: "Paiement à la livraison", short: "€→", color: "#3ad389" },
};

export const onlineMethods: PaymentMethodId[] = ["orange_money", "wave", "mtn_momo", "moov_money", "card"];

import "server-only";
/**
 * Coordonnées de l'administrateur pour le paiement des abonnements, par opérateur.
 * Lues côté serveur uniquement (pas de NEXT_PUBLIC_) : elles ne sont jamais incluses dans le code
 * envoyé aux navigateurs, et ne sont transmises à un vendeur qu'après son échange avec l'admin.
 *
 *   ADMIN_ORANGE_MONEY_NUMBER / ADMIN_ORANGE_MONEY_NAME
 *   ADMIN_WAVE_NUMBER         / ADMIN_WAVE_NAME
 *   ADMIN_MTN_MOMO_NUMBER     / ADMIN_MTN_MOMO_NAME
 *   ADMIN_MOOV_MONEY_NUMBER   / ADMIN_MOOV_MONEY_NAME
 * Un opérateur sans numéro configuré n'est pas proposé aux vendeurs.
 */
export type SubMethod = "orange_money" | "wave" | "mtn_momo" | "moov_money";
const ENV: Record<SubMethod, string> = { orange_money: "ORANGE_MONEY", wave: "WAVE", mtn_momo: "MTN_MOMO", moov_money: "MOOV_MONEY" };

export function adminPaymentInfo(method: SubMethod = "orange_money") {
  const key = ENV[method];
  return {
    number: process.env[`ADMIN_${key}_NUMBER`] ?? "+223 70 00 00 00 (à configurer)",
    name: process.env[`ADMIN_${key}_NAME`] ?? process.env.ADMIN_ORANGE_MONEY_NAME ?? "NEXORA",
  };
}

/** Opérateurs proposés au vendeur : Orange Money toujours, les autres seulement si l'admin a configuré un numéro. */
export function subscriptionMethods(): SubMethod[] {
  return (Object.keys(ENV) as SubMethod[]).filter((m) => m === "orange_money" || process.env[`ADMIN_${ENV[m]}_NUMBER`]);
}

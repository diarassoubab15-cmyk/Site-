import "server-only";
/**
 * Coordonnées Orange Money de l'administrateur pour le paiement des abonnements.
 * Lues côté serveur uniquement (pas de NEXT_PUBLIC_) : elles ne sont jamais incluses dans le code
 * envoyé aux navigateurs, et ne sont transmises à un vendeur qu'après son échange avec l'admin.
 */
export function adminPaymentInfo() {
  return {
    number: process.env.ADMIN_ORANGE_MONEY_NUMBER ?? "+223 70 00 00 00 (à configurer)",
    name: process.env.ADMIN_ORANGE_MONEY_NAME ?? "NEXORA",
  };
}

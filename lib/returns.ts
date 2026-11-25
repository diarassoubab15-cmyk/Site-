/** Règles de retour qu'un vendeur peut choisir ; affichées sur chaque fiche produit. */
export type ReturnPolicy = "7j" | "14j" | "echange" | "aucun";
export const RETURN_LABELS: Record<ReturnPolicy, string> = {
  "7j": "Retour accepté sous 7 jours",
  "14j": "Retour accepté sous 14 jours",
  echange: "Échange seulement (pas de remboursement)",
  aucun: "Ni retour ni échange (sauf produit abîmé ou non conforme)",
};

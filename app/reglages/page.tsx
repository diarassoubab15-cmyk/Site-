import { redirect } from "next/navigation";

// Provisoire : la page Réglages (paiement préféré, panier, historique) arrive à l'étape suivante.
export default function Reglages() {
  redirect("/compte");
}

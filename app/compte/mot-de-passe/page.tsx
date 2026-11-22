import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/NewPasswordForm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false, follow: false } };

/** Après le lien « Mot de passe oublié » : la personne est connectée et choisit son nouveau mot de passe. */
export default function MotDePasse() {
  return (
    <section className="container-x max-w-md py-12 sm:py-16">
      <h1 className="h-section text-4xl">Nouveau mot de passe</h1>
      <p className="mb-8 mt-4 text-ash">Choisissez le mot de passe que vous utiliserez pour vous connecter.</p>
      <NewPasswordForm />
    </section>
  );
}

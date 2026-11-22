import type { Metadata } from "next";
import Link from "next/link";
import { MfaSetup } from "@/components/MfaForms";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sécurité du compte", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Securite() {
  const u = await currentUser();
  const admin = u?.profile?.role === "admin";
  return (
    <section className="container-x max-w-lg py-12 sm:py-16">
      <h1 className="h-section text-4xl">Sécurité du compte</h1>
      <p className="mb-8 mt-4 text-ash">La double vérification ajoute un code à 6 chiffres, affiché par une application sur votre téléphone, en plus du mot de passe.</p>
      <MfaSetup required={admin} />
      <div className="mt-6 card space-y-2 text-sm text-ash">
        <p className="font-medium text-white">Déjà en place sur votre compte</p>
        <p>• Une seule erreur de mot de passe bloque l&apos;appareil pour ce compte (déblocage par « Mot de passe oublié »).</p>
        <p>• Au-delà de 10 erreurs en une heure depuis la même connexion internet, les tentatives sont refusées.</p>
        <p>• <Link href="/compte/mot-de-passe" className="link">Changer mon mot de passe</Link></p>
      </div>
    </section>
  );
}

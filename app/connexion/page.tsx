import type { Metadata } from "next";
import { DemoNotice } from "@/components/DemoNotice";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: true }, alternates: { canonical: "/connexion" } };

export default function Connexion() {
  return (
    <section className="container-x max-w-md py-16 sm:py-24">
      <h1 className="h-section text-4xl sm:text-5xl">Connexion</h1>
      <p className="mb-8 mt-4 text-ash">Un code, et c&apos;est tout. Le même formulaire sert à créer votre compte.</p>
      <DemoNotice>n&apos;importe quel code à 6 chiffres est accepté.</DemoNotice>
      <LoginForm />
    </section>
  );
}

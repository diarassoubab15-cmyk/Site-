import type { Metadata } from "next";
import { MfaVerify } from "@/components/MfaForms";

export const metadata: Metadata = { title: "Code de vérification", robots: { index: false, follow: false } };

export default async function Verification({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/compte";
  return (
    <section className="container-x max-w-md py-12 sm:py-16">
      <h1 className="h-section text-4xl">Code de vérification</h1>
      <p className="mb-8 mt-4 text-ash">Votre compte est protégé par la double vérification.</p>
      <MfaVerify next={safeNext} />
    </section>
  );
}

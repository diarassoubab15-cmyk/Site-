import type { Metadata } from "next";
import { DemoNotice } from "@/components/DemoNotice";
import { SellerView } from "@/components/SellerView";

export const metadata: Metadata = { title: "Espace vendeur", robots: { index: false, follow: false } };

export default function Vendeur() {
  return (
    <section className="container-x py-16">
      <h1 className="h-section mb-8 text-4xl sm:text-5xl">Espace vendeur</h1>
      <DemoNotice />
      <SellerView />
    </section>
  );
}

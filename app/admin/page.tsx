import type { Metadata } from "next";
import { AdminView } from "@/components/AdminView";
import { DemoNotice } from "@/components/DemoNotice";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false, nocache: true } };

export default function Admin() {
  return (
    <section className="container-x py-16">
      <p className="eyebrow">Accès réservé à l&apos;administrateur</p>
      <h1 className="h-section mb-8 mt-4 text-4xl sm:text-5xl">Tableau de bord</h1>
      <DemoNotice />
      <AdminView />
    </section>
  );
}

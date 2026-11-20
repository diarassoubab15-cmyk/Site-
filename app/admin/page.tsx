import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminView } from "@/components/AdminView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadAdmin } from "@/lib/server-data";
import { DemoNotice } from "@/components/DemoNotice";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false, nocache: true } };

export const dynamic = "force-dynamic";

export default async function Admin() {
  const live = supabaseEnabled ? await loadAdmin() : null;
  // Double verrou : le middleware filtre déjà, la page revérifie le rôle.
  if (supabaseEnabled && !live) notFound();
  return (
    <section className="container-x py-16">
      <p className="eyebrow">Accès réservé à l&apos;administrateur</p>
      <h1 className="h-section mb-8 mt-4 text-4xl sm:text-5xl">Tableau de bord</h1>
      <DemoNotice />
      <AdminView live={live} />
    </section>
  );
}

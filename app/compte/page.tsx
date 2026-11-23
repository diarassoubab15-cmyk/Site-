import Link from "next/link";
import type { Metadata } from "next";
import { AccountView } from "@/components/AccountView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadAccount } from "@/lib/server-data";
import { currentUser } from "@/lib/supabase/server";
import { DemoNotice } from "@/components/DemoNotice";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function Compte() {
  const live = supabaseEnabled ? await loadAccount() : null;
  const isAdmin = supabaseEnabled && (await currentUser())?.profile?.role === "admin";
  return (
    <section className="container-x py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-section text-4xl sm:text-5xl">Mon compte</h1>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <Link href="/admin" className="btn-solid">Espace administrateur</Link>}
          {supabaseEnabled && <Link href="/compte/securite" className="btn">Sécurité du compte</Link>}
        </div>
      </div>
      <DemoNotice />
      <AccountView live={live} />
    </section>
  );
}

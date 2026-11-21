import type { Metadata } from "next";
import { DemoNotice } from "@/components/DemoNotice";
import { SellerView } from "@/components/SellerView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadSeller, loadShopProfile } from "@/lib/server-data";
import { ShopProfileForm } from "@/components/ShopProfileForm";

export const metadata: Metadata = { title: "Ma boutique", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function Vendeur() {
  const [live, profile] = supabaseEnabled ? await Promise.all([loadSeller(), loadShopProfile()]) : [null, null];
  return (
    <section className="container-x py-16">
      <h1 className="h-section mb-8 text-4xl sm:text-5xl">Ma boutique</h1>
      <DemoNotice />
      <SellerView live={live} />
      {profile && <div className="mt-6"><ShopProfileForm profile={profile} slug={profile.slug} /></div>}
    </section>
  );
}

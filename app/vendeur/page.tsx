import type { Metadata } from "next";
import { DemoNotice } from "@/components/DemoNotice";
import { SellerView } from "@/components/SellerView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadSeller, loadShopProfile } from "@/lib/server-data";
import { ShopProfileForm } from "@/components/ShopProfileForm";
import { ShopThemeForm } from "@/components/ShopThemeForm";
import { AiStudio } from "@/components/AiStudio";
import { aiStudioState } from "@/app/actions";
import { getShopType } from "@/lib/shop-types";

export const metadata: Metadata = { title: "Ma boutique", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function Vendeur() {
  const [live, profile] = supabaseEnabled ? await Promise.all([loadSeller(), loadShopProfile()]) : [null, null];
  const studio = profile?.tier === "business" ? await aiStudioState() : null;
  return (
    <section className="container-x py-16">
      <h1 className="h-section mb-8 text-4xl sm:text-5xl">Ma boutique</h1>
      <DemoNotice />
      <SellerView live={live} />
      {profile && <div className="mt-6"><ShopProfileForm profile={profile} slug={profile.slug} /></div>}
      {profile && (
        <div className="mt-6">
          <ShopThemeForm
            shopName={profile.name} typeName={getShopType(profile.category)?.name} place={[profile.district, profile.city, profile.country].filter(Boolean).join(", ")}
            tier={profile.tier} initial={{ brandColor: profile.brandColor, signature: profile.signature, displayFont: profile.displayFont }}
            fallbackColor={getShopType(profile.category)?.color ?? "#9281f7"}
          />
        </div>
      )}
      {profile && <div className="mt-6"><AiStudio ultra={profile.tier === "business"} initial={studio} /></div>}
    </section>
  );
}

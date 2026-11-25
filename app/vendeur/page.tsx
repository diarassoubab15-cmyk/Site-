import type { Metadata } from "next";
import { ShopPixelsForm } from "@/components/ShopPixelsForm";
import { DemoNotice } from "@/components/DemoNotice";
import { SellerView } from "@/components/SellerView";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadSeller, loadShopProfile } from "@/lib/server-data";
import { ShopProfileForm } from "@/components/ShopProfileForm";
import { ShopThemeForm } from "@/components/ShopThemeForm";
import { AiStudio } from "@/components/AiStudio";
import { ShopLinkCard } from "@/components/ShopLinkCard";
import { ManualSales } from "@/components/ManualSales";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { site } from "@/lib/site";
import { aiStudioState, myDeliveryZones } from "@/app/actions";
import { DeliveryZones } from "@/components/DeliveryZones";
import { CouriersPanel, SellerBooks } from "@/components/SellerCod";
import { getShopType } from "@/lib/shop-types";

export const metadata: Metadata = { title: "Ma boutique", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function Vendeur() {
  const [live, profile] = supabaseEnabled ? await Promise.all([loadSeller(), loadShopProfile()]) : [null, null];
  const studio = profile?.tier === "business" ? await aiStudioState() : null;
  const zones = profile ? await myDeliveryZones() : [];
  // Adresse publique du site telle que le vendeur la voit (domaine Vercel ou nom de domaine), sinon celle configurée.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const base = host && !host.startsWith("localhost") ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : site.url;
  const qrSvg = profile ? await QRCode.toString(`${base}/b/${profile.slug}`, { type: "svg", margin: 1, color: { dark: "#0b0b0f", light: "#ffffff" } }) : "";
  return (
    <section className="container-x py-16">
      <h1 className="h-section mb-8 text-4xl sm:text-5xl">Ma boutique</h1>
      <DemoNotice />
      {profile && <div className="mb-6"><ShopLinkCard base={base} slug={profile.slug} shopName={profile.name} approved={profile.approved} qrSvg={qrSvg} /></div>}
      <SellerView live={live} />
      {live?.offline && live.shop && live.shop.status !== "fermé" && <div className="mt-6"><ManualSales offline={live.offline} /></div>}
      {live?.shop && live.shop.status === "autorisé" && <div className="mt-6"><SellerBooks orders={live.orders} offlineAmount={live.offline?.monthAmount ?? 0} lowStock={live.lowStock ?? []} /></div>}
      {profile && <div className="mt-6"><DeliveryZones zones={zones} shipDays={profile.shipDays} returnPolicy={profile.returnPolicy} /></div>}
      {profile && <div className="mt-6"><CouriersPanel couriers={live?.couriers ?? []} /></div>}
      {profile && <div className="mt-6"><ShopPixelsForm fb={profile.fbPixel} tiktok={profile.tiktokPixel} allowed={profile.tier === "pro" || profile.tier === "business"} /></div>}
      {profile && <div className="mt-6"><ShopProfileForm profile={profile} slug={profile.slug} /></div>}
      {profile && (
        <div className="mt-6">
          <ShopThemeForm
            shopName={profile.name} typeName={getShopType(profile.category)?.name} place={[profile.district, profile.city, profile.country].filter(Boolean).join(", ")}
            tier={profile.tier} initial={{ brandColor: profile.brandColor, signature: profile.signature, displayFont: profile.displayFont }}
            fallbackColor={getShopType(profile.category)?.color ?? "#5433eb"}
          />
        </div>
      )}
      {profile && <div className="mt-6"><AiStudio ultra={profile.tier === "business"} initial={studio} /></div>}
    </section>
  );
}

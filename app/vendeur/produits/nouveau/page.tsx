import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductEditor } from "@/components/ProductEditor";
import { supabaseEnabled } from "@/lib/supabase/env";
import { loadSellerProducts } from "@/lib/server-data";

export const metadata: Metadata = { title: "Nouveau produit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NouveauProduit() {
  const data = supabaseEnabled ? await loadSellerProducts() : null;
  if (data?.shop?.status !== "approved") redirect("/vendeur/produits");
  return (
    <section className="container-x max-w-3xl py-16">
      <h1 className="h-section mb-8 text-4xl">Nouveau produit</h1>
      <ProductEditor />
    </section>
  );
}

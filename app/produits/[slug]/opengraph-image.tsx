import { ImageResponse } from "next/og";
import { getProductPage } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { getShopType } from "@/lib/shop-types";

/** Aperçu d'un produit partagé sur WhatsApp ou Facebook : nom, prix en FCFA, boutique. */
export const alt = "Produit sur NEXORA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductOg({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getProductPage((await params).slug);
  const p = page?.product;
  const t = p ? getShopType(p.category) : undefined;
  const accent = t?.color ?? "#e08a4f";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#2a1a10" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 560, height: 560, borderRadius: 999, background: accent, opacity: 0.22 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "56px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#f8efe2", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
            NEXORA{t ? <span style={{ fontWeight: 400, letterSpacing: 0, opacity: 0.85 }}>· {t.name}</span> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", fontSize: 72, lineHeight: 1.04, color: "#fff", fontWeight: 700, maxWidth: 1000 }}>{p?.name ?? "Produit introuvable"}</div>
            {p && (
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", background: "#e08a4f", color: "#1f1208", fontSize: 40, fontWeight: 700, padding: "8px 22px", borderRadius: 999 }}>{formatPrice(p.price)}</div>
                <div style={{ display: "flex", color: "#f8efe2", fontSize: 30 }}>chez {page?.shop?.name}</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", color: "#e9dccb", fontSize: 26 }}>{page?.shop?.verified ? "Vendeur vérifié · " : ""}Paiement à la livraison · Wave et Orange Money</div>
        </div>
      </div>
    ),
    size,
  );
}

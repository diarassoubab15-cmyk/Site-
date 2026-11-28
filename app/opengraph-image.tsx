import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Image d'aperçu quand un lien NEXORA est partagé (WhatsApp, Facebook, X…). */
export const alt = "NEXORA : achetez et vendez au Mali, en toute confiance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const photo = await readFile(join(process.cwd(), "public/videos/accueil.jpg")).catch(() => null);
  const src = photo ? `data:image/jpeg;base64,${photo.toString("base64")}` : null;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f8efe2" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 690, padding: "64px 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #5433eb, #e08a4f)", color: "#fff", fontSize: 34, fontWeight: 700 }}>N</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#2a1a10", letterSpacing: 2 }}>NEXORA</div>
          </div>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.05, color: "#1f1208", fontWeight: 700 }}>Achetez et vendez au Mali, en toute confiance.</div>
          <div style={{ display: "flex", fontSize: 26, color: "#5a4433" }}>Vendeurs vérifiés · Paiement à la livraison · Wave et Orange Money</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- image générée côté serveur */}
        {src ? <img src={src} alt="" width={510} height={630} style={{ objectFit: "cover" }} /> : <div style={{ display: "flex", width: 510, background: "#2a1a10" }} />}
      </div>
    ),
    size,
  );
}

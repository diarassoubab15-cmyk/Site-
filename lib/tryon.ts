import "server-only";
/**
 * Essayage virtuel : adaptateur vers un service d'IA d'image (« virtual try-on »).
 *
 *   TRYON_PROVIDER=http   + TRYON_ENDPOINT + TRYON_API_KEY : service réel. Requête JSON :
 *       { person_image: "data:image/…;base64,…", garments: [{ image_url, name, description }], prompt }
 *     Réponse attendue : { image: "data:image/…;base64,…" } ou { image_base64: "…" } ou { image_url: "https://…" }.
 *     (Pour un fournisseur au format différent, une petite passerelle convertit : rien d'autre ne change.)
 *   TRYON_PROVIDER=mock   : TESTS UNIQUEMENT, superpose le vêtement sur la photo (aucune IA).
 *   Sans réglage          : l'essayage est annoncé « bientôt » et aucun essai n'est décompté.
 *
 * La photo du client ne fait que passer : elle n'est jamais écrite sur disque ni en base.
 */
export type Garment = { imageUrl: string; name: string; description?: string };
export type TryOnResult = { image: string };   // data URL

const MAX_OUT = 8 * 1024 * 1024;

export const tryOnProvider = () => (process.env.TRYON_PROVIDER ?? "").trim().toLowerCase();
export const tryOnConfigured = () => {
  const p = tryOnProvider();
  return p === "mock" || (p === "http" && !!process.env.TRYON_ENDPOINT && !!process.env.TRYON_API_KEY);
};

const PROMPT = (g: Garment[]) =>
  `Habille la personne de la photo avec : ${g.map((x) => x.name).join(", ")}. Garde son visage, sa morphologie, sa pose et l'arrière-plan à l'identique ; ` +
  `reproduis fidèlement la coupe, la couleur et les motifs des vêtements fournis.`;

async function fetchImage(url: string): Promise<Buffer> {
  const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`image du vêtement indisponible (${r.status})`);
  return Buffer.from(await r.arrayBuffer());
}

async function viaHttp(person: string, garments: Garment[]): Promise<TryOnResult> {
  const r = await fetch(process.env.TRYON_ENDPOINT!, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.TRYON_API_KEY}` },
    body: JSON.stringify({ person_image: person, garments: garments.map((g) => ({ image_url: g.imageUrl, name: g.name, description: g.description ?? "" })), prompt: PROMPT(garments) }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!r.ok) throw new Error(`service d'essayage : erreur ${r.status}`);
  const j = (await r.json()) as { image?: string; image_base64?: string; image_url?: string };
  if (j.image?.startsWith("data:image/")) return { image: j.image };
  if (j.image_base64) return { image: `data:image/jpeg;base64,${j.image_base64}` };
  if (j.image_url?.startsWith("https://")) {
    const buf = await fetchImage(j.image_url);
    if (buf.length > MAX_OUT) throw new Error("image trop lourde");
    return { image: `data:image/jpeg;base64,${buf.toString("base64")}` };
  }
  throw new Error("réponse du service d'essayage illisible");
}

/** Mode test : superposition simple des vêtements sur la photo (pour vérifier le parcours sans IA). */
async function viaMock(person: string, garments: Garment[]): Promise<TryOnResult> {
  const sharp = (await import("sharp")).default;
  const base = sharp(Buffer.from(person.split(",")[1], "base64"));
  const { width = 800, height = 1000 } = await base.metadata();
  const layers = await Promise.all(
    garments.map(async (g, i) => ({
      input: await sharp(await fetchImage(g.imageUrl)).resize(Math.round(width * 0.42)).ensureAlpha(0.85).png().toBuffer(),
      top: Math.round(height * (0.28 + i * 0.22)),
      left: Math.round(width * 0.29),
    })),
  );
  const out = await base.composite(layers).jpeg({ quality: 82 }).toBuffer();
  return { image: `data:image/jpeg;base64,${out.toString("base64")}` };
}

export async function generateTryOn(person: string, garments: Garment[]): Promise<TryOnResult> {
  const p = tryOnProvider();
  const res = p === "mock" ? await viaMock(person, garments) : await viaHttp(person, garments);
  if (res.image.length > MAX_OUT * 1.4) throw new Error("image trop lourde");
  return res;
}

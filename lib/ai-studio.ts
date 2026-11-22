import "server-only";
/**
 * Studio IA (forfait Ultra) : adaptateur vers le service de génération d'images et de vidéos.
 *
 *   AI_STUDIO_PROVIDER=higgsfield + HIGGSFIELD_API_KEY + HIGGSFIELD_API_SECRET : service réel (Higgsfield).
 *       Requête  : POST https://platform.higgsfield.ai/<modèle>  (en-tête « Authorization: Key <clé>:<secret> »)
 *       Réponse  : { request_id, status_url } ; on interroge ensuite status_url jusqu'à « completed ».
 *       Modèles  : HIGGSFIELD_IMAGE_MODEL (défaut higgsfield-ai/soul/standard),
 *                  HIGGSFIELD_VIDEO_MODEL (défaut higgsfield-ai/dop/standard : anime une image créée).
 *   AI_STUDIO_PROVIDER=mock : TESTS UNIQUEMENT, image dessinée localement et vidéo d'exemple (aucune IA).
 *   Sans réglage : le studio est annoncé « bientôt » et rien n'est décompté.
 */
export type AiKind = "image" | "video";
export type AiCheck =
  | { status: "pending" }
  | { status: "failed"; reason: string }
  | { status: "done"; url?: string; data?: Buffer; contentType: string };

const BASE = "https://platform.higgsfield.ai";
const MAX_BYTES = 50 * 1024 * 1024;

export const aiProvider = () => (process.env.AI_STUDIO_PROVIDER ?? "").trim().toLowerCase();
export const aiConfigured = () => {
  const p = aiProvider();
  return p === "mock" || (p === "higgsfield" && !!process.env.HIGGSFIELD_API_KEY && !!process.env.HIGGSFIELD_API_SECRET);
};

/**
 * Le texte du vendeur, complété pour un rendu de photo réelle (et non « image d'IA ») :
 * lumière naturelle, matières crédibles, pas de texte incrusté, décor d'Afrique de l'Ouest quand c'est pertinent.
 */
export const realisticPrompt = (prompt: string, kind: AiKind) =>
  `${prompt.trim()}. ` +
  (kind === "image"
    ? "Photorealistic commercial photo, natural daylight, real textures and imperfections, true-to-life colors, shot on a full-frame camera, " +
      "no text, no watermark, no logo added, authentic West African (Mali, Côte d'Ivoire, Sénégal) setting when relevant."
    : "Realistic handheld camera movement, natural light, subtle motion, no text, no watermark.");

const auth = () => ({ authorization: `Key ${process.env.HIGGSFIELD_API_KEY}:${process.env.HIGGSFIELD_API_SECRET}`, "content-type": "application/json", accept: "application/json" });

/** Lance la création ; renvoie l'identifiant de la tâche chez le fournisseur. */
export async function submitAi(kind: AiKind, prompt: string, sourceImageUrl?: string): Promise<string> {
  if (aiProvider() === "mock") return `mock-${kind}-${Date.now()}`;
  const model = kind === "image" ? process.env.HIGGSFIELD_IMAGE_MODEL || "higgsfield-ai/soul/standard" : process.env.HIGGSFIELD_VIDEO_MODEL || "higgsfield-ai/dop/standard";
  const body = kind === "image"
    ? { prompt: realisticPrompt(prompt, "image"), aspect_ratio: "4:5", resolution: "1080p" }
    : { prompt: realisticPrompt(prompt, "video"), image_url: sourceImageUrl, duration: 5 };
  const r = await fetch(`${BASE}/${model.replace(/^\/+/, "")}`, { method: "POST", headers: auth(), body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
  const text = await r.text();
  if (!r.ok) throw new Error(`Higgsfield ${r.status} : ${text.slice(0, 200)}`);
  const j = JSON.parse(text) as { request_id?: string; id?: string; status_url?: string };
  const id = j.request_id ?? j.id;
  if (!id) throw new Error("Higgsfield : réponse sans identifiant");
  // On garde l'adresse de suivi si le service en donne une (elle prime sur l'adresse standard).
  return j.status_url?.startsWith(BASE) ? `${id}|${j.status_url}` : id;
}

/** Cherche dans la réponse la première adresse de fichier du bon type (images[].url, video.url, …). */
function findUrl(o: unknown, kind: AiKind): string | undefined {
  const urls: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string" && /^https:\/\//.test(v)) urls.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(o);
  const re = kind === "video" ? /\.(mp4|mov|webm)(\?|$)/i : /\.(jpe?g|png|webp)(\?|$)/i;
  return urls.find((u) => re.test(u)) ?? urls.find((u) => !u.startsWith(BASE));
}

/** Où en est la création ? */
export async function checkAi(kind: AiKind, requestId: string): Promise<AiCheck> {
  if (aiProvider() === "mock") return mockResult(kind, requestId);
  const [id, statusUrl] = requestId.split("|");
  const r = await fetch(statusUrl || `${BASE}/requests/${encodeURIComponent(id)}/status`, { headers: auth(), signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (!r.ok) return r.status >= 500 ? { status: "pending" } : { status: "failed", reason: `suivi ${r.status}` };
  const j = (await r.json()) as { status?: string };
  const s = String(j.status ?? "").toLowerCase();
  if (["failed", "error", "nsfw", "cancelled", "canceled"].includes(s)) return { status: "failed", reason: s };
  if (s !== "completed" && s !== "succeeded" && s !== "done") return { status: "pending" };
  const url = findUrl(j, kind);
  if (!url) return { status: "failed", reason: "résultat sans fichier" };
  return { status: "done", url, contentType: kind === "video" ? "video/mp4" : "image/jpeg" };
}

/** Télécharge le résultat (pour le garder chez NEXORA : les liens du fournisseur expirent). */
export async function downloadAi(url: string): Promise<{ data: Buffer; contentType: string }> {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`téléchargement ${r.status}`);
  const data = Buffer.from(await r.arrayBuffer());
  if (data.length > MAX_BYTES) throw new Error("fichier trop lourd");
  return { data, contentType: r.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream" };
}

/** Mode test : « prêt » au 2e passage ; image dessinée localement, vidéo d'exemple du site. */
async function mockResult(kind: AiKind, requestId: string): Promise<AiCheck> {
  const started = Number(requestId.split("-").pop());
  if (Date.now() - started < 1500) return { status: "pending" };
  if (kind === "video") {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    return { status: "done", data: await readFile(path.join(process.cwd(), "public/videos/accueil.mp4")), contentType: "video/mp4" };
  }
  const sharp = (await import("sharp")).default;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3b341"/><stop offset="1" stop-color="#1d1505"/></linearGradient></defs><rect width="800" height="1000" fill="url(#g)"/><circle cx="560" cy="300" r="140" fill="#fff3c4" opacity="0.7"/></svg>`;
  return { status: "done", data: await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer(), contentType: "image/jpeg" };
}

/**
 * Programme de fabrication des vidéos de boutique.
 *
 *   npm run videos:worker          tourne en continu (vérifie la file toutes les 15 s)
 *   npm run videos:worker -- --once  traite une seule demande puis s'arrête
 *
 * Il se lance sur n'importe quelle machine qui a Node 22, FFmpeg et Chrome/Chromium (votre ordinateur
 * pendant la phase de test, un petit serveur plus tard). Variables lues dans .env.local :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (obligatoires), ANTHROPIC_API_KEY (facultative).
 */
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { makeScript } from "./script.ts";
import { renderVideo } from "./render.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires (voir README, « Vidéos de boutique »).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const once = process.argv.includes("--once");
const MAX_ATTEMPTS = 3;

const CATEGORY_LABELS: Record<string, string> = {
  mode: "Mode & pagnes", beaute: "Beauté & soins", electronique: "Électronique", maison: "Maison & déco",
  alimentation: "Épicerie", gros: "Vente en gros", immobilier: "Immobilier",
};
const log = (m: string) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

async function processOne(): Promise<boolean> {
  const { data: jobs, error } = await sb.rpc("claim_next_video");
  if (error) throw error;
  const job = jobs?.[0];
  if (!job) return false;
  log(`${job.ref} : prise en charge (essai ${job.attempts})`);
  const out = path.join(tmpdir(), "nexora-renders");
  try {
    const { data: shop, error: shopErr } = await sb.from("shops").select("id, name, city, country, category").eq("id", job.shop_id).single();
    if (shopErr || !shop) throw new Error("boutique introuvable");
    const script = await makeScript(job.description, { name: shop.name, city: shop.city, country: shop.country, category: shop.category, categoryLabel: CATEGORY_LABELS[shop.category] ?? shop.category }, log);
    log(`${job.ref} : scénario ${script.source === "ia" ? "rédigé par l'IA" : "simple (sans IA)"}`);
    const { mp4, jpg, duration, bytes } = await renderVideo(script, out, job.id);
    log(`${job.ref} : vidéo rendue (${duration.toFixed(1)} s, ${Math.round(bytes / 1024)} Ko)`);
    const base = `${job.shop_id}/${job.id}`;
    for (const [file, ext, type] of [[mp4, "mp4", "video/mp4"], [jpg, "jpg", "image/jpeg"]] as const) {
      const { error: upErr } = await sb.storage.from("shop-videos").upload(`${base}.${ext}`, readFileSync(file), { contentType: type, upsert: true, cacheControl: "31536000" });
      if (upErr) throw upErr;
    }
    const { error: upd } = await sb
      .from("shop_videos")
      .update({ status: "review", script, video_path: `${base}.mp4`, poster_path: `${base}.jpg`, duration_s: Math.round(duration * 100) / 100, rendered_at: new Date().toISOString(), error: null })
      .eq("id", job.id);
    if (upd) throw upd;
    log(`${job.ref} : déposée, en attente de validation par l'administrateur`);
  } catch (e) {
    const message = (e as Error).message?.slice(0, 900) ?? String(e);
    const retry = job.attempts < MAX_ATTEMPTS;
    await sb.from("shop_videos").update({ status: retry ? "queued" : "failed", error: message }).eq("id", job.id);
    log(`${job.ref} : échec (${message})${retry ? ", sera réessayée" : ", abandonnée"}`);
  } finally {
    rmSync(path.join(out, `${job.id}.mp4`), { force: true });
    rmSync(path.join(out, `${job.id}.jpg`), { force: true });
  }
  return true;
}

async function main() {
  log(`fabrique vidéo démarrée${once ? " (une demande)" : ""} · IA ${process.env.ANTHROPIC_API_KEY ? "activée" : "désactivée (pas de clé ANTHROPIC_API_KEY)"}`);
  for (;;) {
    let worked = false;
    try {
      worked = await processOne();
    } catch (e) {
      log(`erreur de file : ${(e as Error).message}`);
    }
    if (once) break;
    if (!worked) await new Promise((r) => setTimeout(r, 15_000));
  }
}

main();

/**
 * Rendu d'une vidéo avec HyperFrames : assemble le modèle (polices et GSAP en local, aucun CDN),
 * insère le scénario, lance le rendu MP4 puis extrait une image de couverture avec FFmpeg.
 */
import { execFile } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { VideoScript } from "./script.ts";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
/** Version de HyperFrames figée (publiée depuis plus de deux semaines au moment du choix). */
export const HYPERFRAMES = "hyperframes@0.9.19";

/** Prépare un dossier de composition HyperFrames prêt à rendre. */
export function compose(script: VideoScript) {
  const dir = mkdtempSync(path.join(tmpdir(), "nexora-video-"));
  mkdirSync(path.join(dir, "vendor"));
  mkdirSync(path.join(dir, "fonts"));
  copyFileSync(path.join(root, "node_modules/gsap/dist/gsap.min.js"), path.join(dir, "vendor/gsap.min.js"));
  const fonts: [string, string][] = [
    ["@fontsource/inter/files/inter-latin-400-normal.woff2", "inter-400.woff2"],
    ["@fontsource/inter/files/inter-latin-600-normal.woff2", "inter-600.woff2"],
    ["@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", "serif-400.woff2"],
    ["@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", "serif-400-italic.woff2"],
  ];
  for (const [from, to] of fonts) copyFileSync(path.join(root, "node_modules", from), path.join(dir, "fonts", to));
  // JSON inséré dans <script type="application/json"> : « < » est échappé pour qu'aucun texte ne ferme la balise.
  const data = JSON.stringify(script).replace(/</g, "\\u003c").replace(new RegExp("[\\u2028\\u2029]", "g"), " ");
  const html = readFileSync(path.join(here, "template/index.html"), "utf8").replace("/*__DATA__*/", () => data);
  writeFileSync(path.join(dir, "index.html"), html);
  writeFileSync(path.join(dir, "hyperframes.json"), JSON.stringify({ paths: { blocks: "compositions", components: "compositions/components", assets: "assets" } }));
  writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ id: "nexora", name: "nexora", createdAt: new Date().toISOString() }));
  return dir;
}

/** Rend la vidéo et son image de couverture. Renvoie les chemins des fichiers et la durée. */
export async function renderVideo(script: VideoScript, outDir: string, name: string) {
  const dir = compose(script);
  mkdirSync(outDir, { recursive: true });
  const mp4 = path.join(outDir, `${name}.mp4`);
  const jpg = path.join(outDir, `${name}.jpg`);
  try {
    await run("npx", ["-y", HYPERFRAMES, "render", "-o", mp4, "--crf", "30", "--fps", "30"], {
      cwd: dir,
      timeout: 10 * 60_000,
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1", HYPERFRAMES_NO_TELEMETRY: "1", DO_NOT_TRACK: "1" }, // aucune statistique envoyée
    });
    // Couverture : image à 1,6 s (titre affiché), compressée.
    await run("ffmpeg", ["-v", "error", "-y", "-ss", "1.6", "-i", mp4, "-frames:v", "1", "-q:v", "4", jpg]);
    const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", mp4]);
    return { mp4, jpg, duration: Number(stdout.trim()) || 12, bytes: statSync(mp4).size };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

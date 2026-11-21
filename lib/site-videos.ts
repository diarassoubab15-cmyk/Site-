/** Vidéos HyperFrames de l'accueil et des catégories (fichiers dans public/videos, générés par `npm run videos:site`). */
export const SITE_VIDEO_NAMES = ["accueil", "mode", "beaute", "electronique", "maison", "alimentation", "gros", "immobilier", "automobile"] as const;

export function siteVideo(name: string) {
  return (SITE_VIDEO_NAMES as readonly string[]).includes(name) ? { src: `/videos/${name}.mp4`, poster: `/videos/${name}.jpg` } : null;
}

/** Adresse publique d'un fichier du stockage Supabase « shop-videos ». */
export function storageUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/shop-videos/${path}`;
}

"use client";
/**
 * Compression des images dans le navigateur avant l'envoi (économie de données mobiles) :
 * redimensionnement, orientation corrigée, export WebP.
 */
export type Compressed = { blob: Blob; width: number; height: number; ext: "webp" | "jpg" };

export async function compressImage(file: File, maxSide: number, quality = 0.82): Promise<Compressed> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
    throw new Error("Format non pris en charge : envoyez une photo JPEG, PNG ou WebP.");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("Image illisible. Essayez une autre photo.");
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Compression impossible sur cet appareil.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  if (webp && webp.type === "image/webp") return { blob: webp, width, height, ext: "webp" };
  // Navigateurs sans WebP : JPEG.
  const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
  if (!jpg) throw new Error("Compression impossible sur cet appareil.");
  return { blob: jpg, width, height, ext: "jpg" };
}

/** Une photo 360° « équirectangulaire » fait deux fois plus large que haute. */
export const isEquirect = (w: number, h: number) => Math.abs(w / h - 2) < 0.12;

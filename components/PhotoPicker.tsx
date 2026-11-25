"use client";
import { useState } from "react";
import { compressImage } from "@/lib/image-compress";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { toast } from "@/lib/toast";

/**
 * Jusqu'à 4 photos prises au téléphone, réduites sur l'appareil (≈ 150 Ko chacune) puis envoyées
 * dans le dossier du client. Renvoie les chemins enregistrés (avis : public ; réclamation : privé).
 */
export function PhotoPicker({ bucket, value, onChange, label }: { bucket: "review-photos" | "ticket-photos"; value: string[]; onChange: (paths: string[]) => void; label: string }) {
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  async function pick(files: FileList | null) {
    if (!files?.length || !supabaseEnabled) return;
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getUser();
      if (!data.user) return toast("Connectez-vous pour ajouter des photos.", "error");
      const next = [...value];
      for (const file of [...files].slice(0, 4 - value.length)) {
        if (!file.type.startsWith("image/")) continue;
        const c = await compressImage(file, 1200, 0.8);
        const path = `${data.user.id}/${crypto.randomUUID()}.${c.ext}`;
        const { error } = await sb.storage.from(bucket).upload(path, c.blob, { contentType: c.ext === "webp" ? "image/webp" : "image/jpeg" });
        if (error) { toast("Une photo n'a pas pu être envoyée.", "error"); continue; }
        next.push(path);
        setPreviews((p) => ({ ...p, [path]: URL.createObjectURL(c.blob) }));
      }
      onChange(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="label">{label} <span className="text-iron">(facultatif, 4 au plus)</span></p>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((p) => (
          <span key={p} className="relative h-16 w-16 overflow-hidden rounded-[12px] bg-lift">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local */}
            {previews[p] && <img src={previews[p]} alt="" className="h-full w-full object-cover" />}
            <button type="button" aria-label="Retirer la photo" onClick={() => onChange(value.filter((x) => x !== p))}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0b0b0f]/70 text-xs text-[#ffffff]">×</button>
          </span>
        ))}
        {value.length < 4 && (
          <label className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-[12px] border border-dashed border-line text-xl text-ash ${busy ? "opacity-50" : ""}`}>
            {busy ? "…" : "📷"}
            <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
    </div>
  );
}

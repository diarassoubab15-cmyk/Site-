"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { setShopSlug } from "@/app/actions";

/** Pendant la saisie : minuscules sans accents, espaces et signes changés en tirets (le tiret final reste possible). */
const cleanSlug = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-{2,}/g, "-").slice(0, 40);

/**
 * « Le lien de votre boutique » : l'adresse à donner aux clients (lien court /b/…),
 * avec Copier, Envoyer par WhatsApp, Partager, un QR code à imprimer et le choix de l'adresse.
 */
export function ShopLinkCard({ base, slug, shopName, approved, qrSvg }: { base: string; slug: string; shopName: string; approved: boolean; qrSvg: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(slug);
  const link = `${base}/b/${slug}`;
  const shown = link.replace(/^https?:\/\//, "");
  const message = `Retrouvez ma boutique ${shopName} sur NEXORA : ${link}`;

  async function copy() {
    try { await navigator.clipboard.writeText(link); toast("Lien copié", "ok"); }
    catch { toast("Copie impossible : appuyez longuement sur le lien pour le copier.", "error"); }
  }
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: shopName, text: `Retrouvez ma boutique ${shopName} sur NEXORA`, url: link }); } catch { /* annulé */ }
    } else copy();
  }
  function downloadQr() {
    const a = document.createElement("a");
    a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;
    a.download = `qr-${slug}.svg`;
    a.click();
  }
  function save() {
    start(async () => {
      const r = await setShopSlug({ slug: draft.replace(/-+$/, "") });
      if (!r.ok) { toast(r.error ?? "Erreur", "error"); return; }
      toast("Nouvelle adresse enregistrée. L'ancienne mène toujours à votre boutique.", "ok");
      setEdit(false);
      router.refresh();
    });
  }

  return (
    <section className="card" aria-labelledby="lien-titre">
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <h2 id="lien-titre" className="text-lg font-medium text-white">Le lien de votre boutique</h2>
          <p className="mt-1 text-sm text-ash">Donnez-le à vos clients : sur WhatsApp, Facebook, TikTok, vos cartes de visite ou votre vitrine.</p>
          {!approved && <p className="mt-3 rounded-[14px] bg-lift p-3 text-sm text-ash">Votre lien sera actif dès que NEXORA aura autorisé votre boutique. Vous pouvez déjà choisir votre adresse.</p>}

          <div className="link-pill mt-4">
            <span className="truncate font-mono text-sm text-white" title={link}>{shown}</span>
            <button type="button" className="btn-solid shrink-0 px-4 py-2" onClick={copy}>Copier</button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#25d366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.4.1.1.1.7-.1 1.3Z" /></svg>
              WhatsApp
            </a>
            <a className="btn" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877f2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" /></svg>
              Facebook
            </a>
            <button type="button" className="btn" onClick={share}>Partager</button>
            <a className="btn" href={`/b/${slug}`} target="_blank" rel="noopener">Voir ma boutique</a>
          </div>
        </div>

        <figure className="flex flex-col items-center gap-2 sm:w-40">
          <span className="qr-box" role="img" aria-label={`QR code du lien ${shown}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <button type="button" className="text-xs text-iris underline underline-offset-4" onClick={downloadQr}>Télécharger le QR code</button>
          <figcaption className="text-center text-[11px] text-iron">À imprimer pour votre vitrine</figcaption>
        </figure>
      </div>

      <div className="mt-6 border-t border-line pt-4">
        {!edit ? (
          <button type="button" className="text-sm text-iris underline underline-offset-4" onClick={() => { setDraft(slug); setEdit(true); }}>
            Changer l&apos;adresse de ma boutique
          </button>
        ) : (
          <div className="space-y-3">
            <label htmlFor="slug" className="label">Adresse de votre boutique</label>
            <div className="link-pill">
              <span className="shrink-0 font-mono text-sm text-iron">{base.replace(/^https?:\/\//, "")}/b/</span>
              <input id="slug" className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white outline-none" value={draft} maxLength={40}
                onChange={(e) => setDraft(cleanSlug(e.target.value))} autoComplete="off" spellCheck={false} />
            </div>
            <p className="text-xs text-iron">3 à 40 caractères : lettres, chiffres et tirets. Vos anciens liens continueront de mener à votre boutique. 3 changements par mois au plus.</p>
            <div className="flex gap-2">
              <button type="button" className="btn-solid" disabled={pending || draft.replace(/-+$/, "").length < 3 || draft === slug} onClick={() => { setDraft(draft.replace(/-+$/, "")); save(); }}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
              <button type="button" className="btn" onClick={() => setEdit(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/format";
import type { EditRequestView } from "@/lib/views";
import { cancelProductEdit, requestProductEdit } from "@/app/actions";
import { EditDiff } from "./EditDiff";

const STATUS: Record<EditRequestView["status"], { label: string; cls: string }> = {
  review: { label: "En attente de validation", cls: "border-iris/50 text-iris-glow" },
  applied: { label: "Appliquée", cls: "border-pulse/50 text-pulse" },
  rejected: { label: "Refusée", cls: "border-alarm/50 text-alarm" },
  cancelled: { label: "Annulée", cls: "border-line text-iron" },
};

/** Le vendeur écrit ce qu'il veut changer sur sa fiche ; NEXORA prépare et valide la modification. */
export function ProductEditRequests({ productId, requests }: { productId: string; requests: EditRequestView[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await requestProductEdit({ productId, message });
      if (!r.ok) return toast(r.error ?? "Envoi impossible", "error");
      setMessage("");
      toast("Demande envoyée : l'administrateur la valide avant qu'elle n'apparaisse sur la fiche");
      router.refresh();
    });
  }

  return (
    <section className="card space-y-5" aria-labelledby="modif-texte">
      <div>
        <h2 id="modif-texte" className="text-lg font-medium text-white">Demander une modification</h2>
        <p className="mt-2 text-sm text-ash">
          Écrivez simplement ce que vous voulez changer sur votre fiche, comme à un collègue : « baisse le prix à 15 000 », « ajoute que c'est fait main à Ségou »,
          « enlève la couleur rouge ». NEXORA prépare la modification et l'administrateur la vérifie avant qu'elle n'apparaisse.
        </p>
      </div>
      <form onSubmit={send} className="space-y-3">
        <label htmlFor="modif-message" className="sr-only">Votre demande</label>
        <textarea
          id="modif-message"
          required
          minLength={5}
          maxLength={1000}
          rows={3}
          className="input"
          placeholder="Ex. : mets le prix à 15 000 FCFA et ajoute que la livraison à Bamako est gratuite"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-iron">{message.length}/1000</span>
          <button className="btn-solid" disabled={pending || message.trim().length < 5} data-haptic>{pending ? "Préparation…" : "Envoyer la demande"}</button>
        </div>
      </form>

      {requests.length > 0 && (
        <ul className="space-y-4 border-t border-line pt-5">
          {requests.map((r) => (
            <li key={r.id} className="space-y-3" data-edit-request={r.status}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`badge ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                <span className="font-mono text-xs text-iron">{formatDate(r.createdAt)}</span>
              </div>
              <p className="whitespace-pre-line break-words text-sm text-bone">« {r.message} »</p>
              {r.status === "review" && r.proposal && (
                <div className="space-y-2">
                  <p className="text-xs text-ash">Modification préparée {r.ai ? "avec l'IA" : "automatiquement"}, à confirmer par l'administrateur :</p>
                  <EditDiff changes={r.proposal.changes} current={r.current} />
                </div>
              )}
              {r.status === "applied" && r.applied && <p className="text-xs text-ash">Changé : {Object.keys(r.applied).map((k) => FIELD[k] ?? k).join(", ")}.</p>}
              {r.adminNote && r.status !== "review" && <p className="text-sm text-ash"><span className="text-bone">Message de l'administrateur :</span> {r.adminNote}</p>}
              {r.status === "review" && (
                <button
                  type="button"
                  className="text-xs text-alarm hover:underline"
                  disabled={pending}
                  onClick={() => start(async () => { const x = await cancelProductEdit({ id: r.id }); toast(x.ok ? "Demande annulée" : x.error ?? "Erreur", x.ok ? "ok" : "error"); router.refresh(); })}
                >
                  Annuler la demande
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const FIELD: Record<string, string> = { name: "nom", short: "accroche", description: "description", price: "prix", compareAt: "prix barré", specs: "caractéristiques" };

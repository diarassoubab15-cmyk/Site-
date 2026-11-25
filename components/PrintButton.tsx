"use client";
/** « Imprimer / enregistrer en PDF » (sur téléphone : Partager → Imprimer → PDF). */
export function PrintButton() {
  return <button type="button" className="btn-solid" onClick={() => window.print()}>Imprimer ou enregistrer en PDF</button>;
}

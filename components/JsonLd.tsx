/** Données structurées schema.org (résultats enrichis Google : prix, étoiles, fil d'Ariane). */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Échappe « < » pour qu'aucun contenu ne puisse fermer la balise script.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

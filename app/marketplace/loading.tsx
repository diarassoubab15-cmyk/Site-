/** Squelettes affichés pendant le chargement des résultats (filtres, recherche). */
export default function Loading() {
  return (
    <section className="container-x py-16" aria-busy="true" aria-label="Chargement des produits">
      <div className="skeleton mb-8 h-4 w-48 rounded-[6px]" />
      <div className="skeleton h-12 w-72 rounded-[6px]" />
      <div className="skeleton mb-10 mt-4 h-4 w-60 rounded-[6px]" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-[16px] border border-line p-3">
            <div className="skeleton aspect-square rounded-[12px]" />
            <div className="skeleton mt-4 h-4 w-3/4 rounded" />
            <div className="skeleton mt-2 h-3 w-1/2 rounded" />
            <div className="skeleton mt-4 h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

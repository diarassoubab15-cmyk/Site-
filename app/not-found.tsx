import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x py-32 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="h-display mt-6">Page introuvable</h1>
      <p className="mx-auto mt-6 max-w-md text-ash">Ce lien n&apos;existe plus ou a été déplacé. Le produit a peut-être été retiré par son vendeur.</p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/marketplace" className="btn-solid">Voir la marketplace</Link>
        <Link href="/support" className="btn">Contacter le SAV</Link>
      </div>
    </section>
  );
}

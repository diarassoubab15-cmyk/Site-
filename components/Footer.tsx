import Link from "next/link";
import { Logo } from "./Logo";
import { site } from "@/lib/site";
import { categories } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-ash">{site.tagline}.</p>
        </div>
        <nav aria-label="Catégories" className="space-y-2 text-sm">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-iron">Acheter</p>
          {categories.map((c) => (
            <Link key={c.slug} href={`/marketplace/${c.slug}`} className="block text-ash hover:text-white">
              {c.name}
            </Link>
          ))}
        </nav>
        <nav aria-label="Vendeurs" className="space-y-2 text-sm">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-iron">Vendre</p>
          <Link href="/vendre" className="block text-ash hover:text-white">Devenir vendeur</Link>
          <Link href="/tarifs" className="block text-ash hover:text-white">Tarifs</Link>
          <Link href="/vendeur" className="block text-ash hover:text-white">Espace vendeur</Link>
          <Link href="/securite" className="block text-ash hover:text-white">Sécurité des données</Link>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-iron">Service client</p>
          <Link href="/support" className="block text-ash hover:text-white">Contacter le SAV</Link>
          <Link href="/support#signaler" className="block text-ash hover:text-white">Signaler un vendeur</Link>
          <Link href="/support#remboursement" className="block text-ash hover:text-white">Demander un remboursement</Link>
          <a href={`mailto:${site.support.email}`} className="block font-mono text-xs text-iris">{site.support.email}</a>
          <p className="text-xs text-iron">{site.support.hours}</p>
        </div>
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 text-sm text-ash">
        <p>© {new Date().getFullYear()} NEXORA</p>
        <div className="flex gap-6">
          <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
          <Link href="/conditions" className="hover:text-white">Conditions</Link>
        </div>
      </div>
    </footer>
  );
}

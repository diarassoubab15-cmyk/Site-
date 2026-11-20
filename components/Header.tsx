import Link from "next/link";
import { Logo } from "./Logo";

const nav = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/vendre", label: "Vendre" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/securite", label: "Sécurité" },
  { href: "/support", label: "Aide & SAV" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-black/90 backdrop-blur-[25px]">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-bone transition-colors hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/connexion" className="text-sm text-bone hover:text-white">
            Connexion
          </Link>
          <Link href="/vendre" className="btn">
            Ouvrir ma boutique
          </Link>
        </div>
        {/* Menu mobile sans JavaScript */}
        <details className="group relative md:hidden">
          <summary className="btn list-none px-3 py-2 [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Fermer</span>
          </summary>
          <div className="absolute right-0 top-12 w-64 rounded-[16px] border border-line bg-black p-2">
            {[...nav, { href: "/connexion", label: "Connexion" }].map((n) => (
              <Link key={n.href} href={n.href} className="block rounded-[6px] px-3 py-2.5 text-sm text-bone hover:bg-lift hover:text-white">
                {n.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}

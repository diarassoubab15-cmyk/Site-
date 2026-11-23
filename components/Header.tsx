import Link from "next/link";
import { Logo } from "./Logo";
import { CartBadge } from "./SettingsPanels";
import { AccountNav } from "./AccountNav";

const nav = [
  { href: "/award", label: "Award" },
  { href: "/categories", label: "Catégories" },
  { href: "/marketplace", label: "Produits" },
  { href: "/trouver", label: "Assistant" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/reglages", label: "Réglages" },
  { href: "/support", label: "Aide & SAV" },
];

export function Header() {
  return (
    <header className="nav-drop sticky top-0 z-40 border-b border-line/60 bg-[#ffffff]/80 backdrop-blur-[25px]">
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
          <CartBadge />
          <AccountNav variant="desktop" />
          <Link href="/vendre" className="btn hidden px-4 py-2 lg:inline-flex">
            Créer ma boutique
          </Link>
        </div>
        {/* Menu mobile sans JavaScript */}
        <div className="ml-auto flex items-center gap-1 md:hidden"><CartBadge /></div>
        <details className="group relative md:hidden">
          <summary className="btn list-none px-3 py-2 [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Fermer</span>
          </summary>
          <div className="absolute right-0 top-12 w-64 rounded-[22px] bg-black p-2 shadow-[var(--shadow-float)]">
            <AccountNav variant="mobile" />
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded-full px-4 py-2.5 text-sm text-bone hover:bg-lift hover:text-white">
                {n.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}

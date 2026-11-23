"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getHubRoles } from "@/app/actions";
import { supabaseEnabled } from "@/lib/supabase/env";

type Roles = { loggedIn: boolean; admin: boolean; seller: boolean };
const KEY = "nx-roles";

/**
 * Liens du compte dans l'en-tête : « Se connecter / S'inscrire » pour les visiteurs,
 * « Mon compte » (+ « Ma boutique », + « Admin » pour le fondateur) une fois connecté.
 * Le rôle vient du serveur ; une copie en mémoire de l'onglet évite le clignotement d'une page à l'autre.
 */
export function AccountNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const [roles, setRoles] = useState<Roles | null>(null);

  useEffect(() => {
    if (!supabaseEnabled) return;
    try { const c = sessionStorage.getItem(KEY); if (c) setRoles(JSON.parse(c)); } catch { /* stockage indisponible */ }
    let live = true;
    getHubRoles().then((r) => {
      if (!live || !r.ok || !r.data) return;
      const next = { loggedIn: !!r.data.loggedIn, admin: r.data.admin, seller: r.data.seller };
      setRoles(next);
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* idem */ }
    });
    return () => { live = false; };
  }, [pathname]);

  const links = roles?.loggedIn
    ? [
        ...(roles.admin ? [{ href: "/admin", label: "Admin", strong: true }] : []),
        ...(roles.seller ? [{ href: "/vendeur", label: "Ma boutique", strong: false }] : []),
        { href: "/compte", label: "Mon compte", strong: !roles.admin },
      ]
    : [
        { href: "/connexion", label: "Se connecter", strong: false },
        { href: "/connexion?mode=inscription", label: "S'inscrire", strong: true },
      ];

  if (variant === "mobile")
    return (
      <>
        {links.map((n) => (
          <Link key={n.href} href={n.href} className={`block rounded-full px-4 py-2.5 text-sm hover:bg-lift ${n.strong ? "font-medium text-iris" : "text-bone hover:text-white"}`}>
            {n.label}
          </Link>
        ))}
      </>
    );
  return (
    <>
      {links.map((n) =>
        n.strong ? (
          <Link key={n.href} href={n.href} className="btn-solid px-4 py-2">{n.label}</Link>
        ) : (
          <Link key={n.href} href={n.href} className="text-sm text-bone hover:text-white">{n.label}</Link>
        ),
      )}
    </>
  );
}

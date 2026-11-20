import Link from "next/link";

/** Bouton SAV visible sur toutes les pages : le support ne doit jamais être difficile à trouver. */
export function SupportButton() {
  return (
    <Link
      href="/support"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-line bg-black/90 px-4 py-2.5 text-sm text-white backdrop-blur-[25px] transition-colors hover:border-white"
    >
      <span className="h-2 w-2 rounded-full bg-pulse" aria-hidden="true" />
      Besoin d&apos;aide ?
    </Link>
  );
}

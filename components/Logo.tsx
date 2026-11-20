import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="NEXORA, accueil">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 16V8l8 8V8" stroke="#9281f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[0.18em]">NEXORA</span>
    </Link>
  );
}

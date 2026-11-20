/** Transition douce à chaque changement de page (fondu + léger glissement, 280 ms). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

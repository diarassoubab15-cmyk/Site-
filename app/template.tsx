import { PageMark } from "@/components/PageMark";

/** Transition douce à chaque changement de page (fondu + léger glissement), et le logo qui arrive en tournant. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter">
      <PageMark />
      {children}
    </div>
  );
}

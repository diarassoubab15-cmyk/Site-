import { supabaseEnabled } from "@/lib/supabase/env";

/** Bandeau « mode démo » : affiché seulement quand Supabase n'est pas configuré. */
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  if (supabaseEnabled) return null;
  return (
    <p className="mb-8 rounded-[6px] border border-amber/30 px-3 py-2 font-mono text-xs text-amber">
      Mode démo · {children ?? "les actions sont enregistrées dans votre navigateur uniquement, en attendant le branchement de Supabase."}
    </p>
  );
}

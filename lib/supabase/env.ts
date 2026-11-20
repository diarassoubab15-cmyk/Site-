export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Vrai quand Supabase est configuré. Sinon, le site tourne en mode démo (localStorage). */
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

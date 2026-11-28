import "server-only";
import { supabaseService } from "./supabase/server";
/**
 * Coordonnées de l'administrateur pour le paiement des abonnements, par opérateur.
 * Lues côté serveur uniquement : jamais incluses dans le code envoyé aux navigateurs,
 * et transmises à un vendeur seulement après son échange avec l'admin.
 *
 * Source : la table privée `admin_settings` de Supabase (aucun accès public), à défaut
 * les variables Vercel du même nom :
 *   ADMIN_ORANGE_MONEY_NUMBER / ADMIN_ORANGE_MONEY_NAME
 *   ADMIN_WAVE_NUMBER         / ADMIN_WAVE_NAME
 *   ADMIN_MTN_MOMO_NUMBER     / ADMIN_MTN_MOMO_NAME
 *   ADMIN_MOOV_MONEY_NUMBER   / ADMIN_MOOV_MONEY_NAME
 * Un opérateur sans numéro configuré n'est pas proposé aux vendeurs (Wave en premier : compte au nom du fondateur).
 */
export type SubMethod = "orange_money" | "wave" | "mtn_momo" | "moov_money";
const ENV: Record<SubMethod, string> = { orange_money: "ORANGE_MONEY", wave: "WAVE", mtn_momo: "MTN_MOMO", moov_money: "MOOV_MONEY" };

async function settings(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    // Table hors des types générés : lecture non typée, par le client « service » (la RLS bloque tout le reste).
    const { data } = await (supabaseService() as unknown as { from: (t: string) => { select: (c: string) => Promise<{ data: { key: string; value: string }[] | null }> } })
      .from("admin_settings").select("key, value");
    for (const row of data ?? []) out[row.key] = row.value;
  } catch {
    // Base indisponible ou clé service absente (mode démo) : variables d'environnement seules.
  }
  return out;
}

function pick(s: Record<string, string>, name: string) {
  return s[name] || process.env[name] || undefined;
}

export async function adminPaymentInfo(method: SubMethod = "wave") {
  const s = await settings();
  const key = ENV[method];
  return {
    number: pick(s, `ADMIN_${key}_NUMBER`) ?? "+223 70 00 00 00 (à configurer)",
    name: pick(s, `ADMIN_${key}_NAME`) ?? pick(s, "ADMIN_ORANGE_MONEY_NAME") ?? "NEXORA",
  };
}

/**
 * Opérateurs proposés au vendeur pour payer son forfait : seulement ceux dont l'admin a configuré un numéro
 * À SON NOM, Wave en premier. Rien de configuré : Wave seul est affiché (« à configurer »).
 */
export async function subscriptionMethods(): Promise<SubMethod[]> {
  const s = await settings();
  const order: SubMethod[] = ["wave", "orange_money", "mtn_momo", "moov_money"];
  const set = order.filter((m) => pick(s, `ADMIN_${ENV[m]}_NUMBER`));
  return set.length ? set : ["wave"];
}

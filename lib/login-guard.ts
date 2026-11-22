import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseService } from "@/lib/supabase/server";

/**
 * Une seule erreur de mot de passe bloque cet appareil pour ce compte.
 * Appareil : identifiant aléatoire dans un cookie protégé (httpOnly, 5 ans). Compte : SHA-256 de l'e-mail.
 * Limite assumée : effacer les données du navigateur crée un « nouvel appareil » ; c'est la seule
 * façon de reconnaître un appareil sans collecter d'informations personnelles sur lui.
 */
const COOKIE = "nx_device";
const hashEmail = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

export async function deviceId(create = true): Promise<string | null> {
  const store = await cookies();
  const current = store.get(COOKIE)?.value;
  if (current && /^[0-9a-f-]{36}$/.test(current)) return current;
  if (!create) return null;
  const id = randomUUID();
  store.set(COOKIE, id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 5 });
  return id;
}

export async function isBlocked(device: string, email: string) {
  const { data } = await supabaseService().from("login_blocks").select("device_id").eq("device_id", device).eq("email_hash", hashEmail(email)).maybeSingle();
  return !!data;
}

export async function block(device: string, email: string) {
  await supabaseService().from("login_blocks").upsert({ device_id: device, email_hash: hashEmail(email) }, { onConflict: "device_id,email_hash", ignoreDuplicates: true });
}

/** Le propriétaire a prouvé son identité par un lien reçu par e-mail : on lève le blocage de cet appareil. */
export async function unblock(device: string, email: string) {
  await supabaseService().from("login_blocks").delete().eq("device_id", device).eq("email_hash", hashEmail(email));
}

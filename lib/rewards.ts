/** Périodes des récompenses (mois, semestre, année) et libellés, partagés par le serveur et le navigateur. */
export type RewardKind = "month" | "semester" | "year" | "gift";
export type Period = { key: string; label: string; from: string; to: string };

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const iso = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toISOString();

export const kindTitle: Record<RewardKind, string> = {
  month: "Meilleur vendeur du mois",
  semester: "Meilleur vendeur du semestre",
  year: "Meilleur vendeur de l'année",
  gift: "Mois offerts",
};

/** Mois offerts proposés par défaut (l'admin peut changer). */
export const defaultFreeMonths: Record<RewardKind, number> = { month: 1, semester: 3, year: 6, gift: 1 };

export function periodOf(kind: Exclude<RewardKind, "gift">, key: string): Period | null {
  if (kind === "month") {
    const m = /^(\d{4})-(\d{2})$/.exec(key);
    if (!m) return null;
    const y = +m[1], mo = +m[2] - 1;
    if (mo < 0 || mo > 11) return null;
    return { key, label: `${MONTHS[mo]} ${y}`, from: iso(y, mo), to: iso(y, mo + 1) };
  }
  if (kind === "semester") {
    const m = /^(\d{4})-S([12])$/.exec(key);
    if (!m) return null;
    const y = +m[1], s = +m[2];
    return { key, label: `${s === 1 ? "1er" : "2e"} semestre ${y}`, from: iso(y, s === 1 ? 0 : 6), to: iso(y, s === 1 ? 6 : 12) };
  }
  const m = /^(\d{4})$/.exec(key);
  if (!m) return null;
  return { key, label: `l'année ${m[1]}`, from: iso(+m[1], 0), to: iso(+m[1] + 1, 0) };
}

/** Périodes proposées, de la plus récente à la plus ancienne (la période en cours en premier). */
export function periodsFor(kind: Exclude<RewardKind, "gift">, now = new Date()): Period[] {
  const y = now.getUTCFullYear(), mo = now.getUTCMonth();
  const keys: string[] = [];
  if (kind === "month") for (let i = 0; i < 13; i++) { const d = new Date(Date.UTC(y, mo - i, 1)); keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`); }
  if (kind === "semester") { let yy = y, s = mo < 6 ? 1 : 2; for (let i = 0; i < 5; i++) { keys.push(`${yy}-S${s}`); s = s === 1 ? 2 : 1; if (s === 2) yy--; } }
  if (kind === "year") for (let i = 0; i < 3; i++) keys.push(String(y - i));
  return keys.map((k) => periodOf(kind, k)!);
}

/** « Meilleur vendeur de novembre 2026 », « … du 2e semestre 2026 », « … de l'année 2026 ». */
export function rewardTitle(kind: Exclude<RewardKind, "gift">, key: string) {
  const p = periodOf(kind, key);
  if (!p) return kindTitle[kind];
  // Élision : « d'octobre », « d'avril », « d'août ».
  if (kind === "month") return /^[aeiouéèêâàôûî]/i.test(p.label) ? `Meilleur vendeur d'${p.label}` : `Meilleur vendeur de ${p.label}`;
  return kind === "semester" ? `Meilleur vendeur du ${p.label}` : `Meilleur vendeur de ${p.label}`;
}

/** « 2027-01 » → « janvier 2027 » */
export const monthLabel = (ym: string) => periodOf("month", ym)?.label ?? ym;

/** Date ISO (aaaa-mm-jj) → « 1 janv. 2027 » */
export const shortDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export type RankingRow = {
  shopId: string;
  shopName: string;
  owner: string;
  phone: string;
  delivered: number;
  revenue: number;
  rating: number | null;
  reviews: number;
  disputes: number;
};

export type RewardView = {
  id: string;
  shopId: string;
  shopName: string;
  kind: RewardKind;
  periodKey: string;
  title: string;
  freeMonths: number;
  startsOn: string | null;
  endsOn: string | null;
  note?: string;
  revoked: boolean;
  createdAt: string;
};

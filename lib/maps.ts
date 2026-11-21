/**
 * Liens Google Maps des boutiques physiques : on n'accepte QUE des liens Google Maps
 * (même règle que la base), on en extrait les coordonnées quand le lien les contient,
 * et la carte intégrée se fait sans clé (adresse publique d'intégration de Google Maps).
 */
const MAPS_RE = /^https:\/\/((www\.)?google\.[a-z.]{2,8}\/maps|maps\.google\.[a-z.]{2,8}\/|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)/i;

export const isMapsUrl = (url: string) => url.length <= 500 && MAPS_RE.test(url.trim());

/** « …/@12.6392,-8.0029,17z » ou « …?q=12.6392,-8.0029 » → coordonnées ; liens courts (maps.app.goo.gl) → null. */
export function coordsFromMapsUrl(url: string): { lat: number; lng: number } | null {
  const m = /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/.exec(url) ?? /[?&](?:q|query|ll)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/.exec(decodeURIComponent(url));
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat: round6(lat), lng: round6(lng) } : null;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

export const mapsLinkFromCoords = (lat: number, lng: number) => `https://www.google.com/maps?q=${round6(lat)},${round6(lng)}`;

/** Carte intégrée : par coordonnées si on les a, sinon par l'adresse écrite. */
export function mapsEmbedUrl(s: { lat?: number | null; lng?: number | null; name: string; district?: string | null; city: string; country: string }) {
  const q = s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : [s.name, s.district, s.city, s.country].filter(Boolean).join(", ");
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
}

/** Numéro → lien WhatsApp (chiffres seulement) et lien d'appel. */
export const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

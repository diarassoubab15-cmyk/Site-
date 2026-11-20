const fcfa = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 12900 -> « 12 900 FCFA » */
export function formatPrice(amount: number) {
  return `${fcfa.format(amount).replace(/ | /g, " ")} FCFA`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

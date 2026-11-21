/** Liens WhatsApp et appel direct. */
const digits = (n: string) => n.replace(/[^\d]/g, "");

export const whatsappLink = (number: string, text?: string) =>
  `https://wa.me/${digits(number)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const callLink = (number: string) => `tel:+${digits(number)}`;

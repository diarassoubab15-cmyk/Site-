export const site = {
  name: "NEXORA",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexora.example").replace(/\/$/, ""),
  tagline: "La marketplace africaine où chaque vendeur est vérifié",
  description:
    "Achetez et vendez en ligne en Afrique : vendeurs vérifiés, paiement Orange Money, Wave, MTN MoMo, carte bancaire ou à la livraison. Le vendeur reçoit son argent directement, sans commission sur les ventes.",
  locale: "fr_FR",
  support: {
    email: "support@nexora.example",
    // Numéro WhatsApp et téléphone de l'administrateur (variables NEXT_PUBLIC_ADMIN_* ; valeurs d'exemple sinon)
    whatsapp: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "+22370000000",
    phone: process.env.NEXT_PUBLIC_ADMIN_PHONE ?? process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "+22370000000",
    phoneDisplay: process.env.NEXT_PUBLIC_ADMIN_PHONE_DISPLAY ?? "+223 70 00 00 00",
    hours: "7 j/7, de 8 h à 20 h (GMT)",
    firstResponse: "moins de 2 heures",
  },
} as const;

export const absoluteUrl = (path = "/") => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;

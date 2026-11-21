/**
 * Vidéos de la page d'accueil et des catégories, rendues avec HyperFrames dans public/videos/.
 *
 *   npm run videos:site                 toutes les vidéos
 *   npm run videos:site -- accueil mode   seulement celles nommées
 *
 * Les textes sont ici : modifiez-les puis relancez la commande. Ils seront affinés avec
 * les descriptions de chaque partie fournies par le propriétaire.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ACCENTS, type VideoScript } from "./script.ts";
import { renderVideo } from "./render.ts";

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/videos");
const brand = (category: string, accent: keyof typeof ACCENTS, s: Omit<VideoScript, "category" | "colors" | "where" | "source">): VideoScript => ({
  ...s,
  category,
  where: "nexora · marketplace africaine",
  colors: { accent: ACCENTS[accent][0], accent2: ACCENTS[accent][1] },
  source: "simple",
});

export const SITE_VIDEOS: Record<string, VideoScript> = {
  accueil: brand("Marketplace africaine", "violet", {
    headline: "NEXORA",
    tagline: "Vendez partout en Afrique. Encaissez directement.",
    scenes: [
      { title: "Vendeurs vérifiés", text: "Chaque boutique est contrôlée avant de vendre.", icon: "bouclier" },
      { title: "Orange Money, Wave, carte", text: "Ou paiement à la livraison, en main propre.", icon: "telephone" },
      { title: "0 % de commission", text: "L'argent arrive directement chez le vendeur.", icon: "coeur" },
    ],
    closing: "Ouvrez votre boutique ce soir",
    mood: "élégant",
  }),
  mode: brand("Mode & pagnes", "violet", {
    headline: "Mode & pagnes",
    tagline: "Wax, bazin et créations cousues en Afrique.",
    scenes: [
      { title: "Créateurs locaux", text: "Des ateliers vérifiés, de Dakar à Abidjan.", icon: "tissu" },
      { title: "Pièces uniques", text: "Des motifs et des coupes qu'on ne voit nulle part ailleurs.", icon: "etoile" },
      { title: "Essayez, puis payez", text: "Paiement à la livraison chez de nombreux vendeurs.", icon: "camion" },
    ],
    closing: "Trouvez votre prochaine tenue",
    mood: "élégant",
  }),
  beaute: brand("Beauté & soins", "or", {
    headline: "Beauté & soins",
    tagline: "Karité, savon noir et soins naturels.",
    scenes: [
      { title: "Du producteur", text: "Coopératives et artisans, sans intermédiaire.", icon: "feuille" },
      { title: "Naturel", text: "Des compositions simples, décrites par le vendeur.", icon: "flacon" },
      { title: "Avis vérifiés", text: "Seuls les acheteurs qui ont reçu le produit notent.", icon: "coeur" },
    ],
    closing: "Prenez soin de vous",
    mood: "chaleureux",
  }),
  electronique: brand("Électronique", "bleu", {
    headline: "Électronique",
    tagline: "Téléphones, accessoires et solaire.",
    scenes: [
      { title: "Vendeurs contrôlés", text: "Des boutiques vérifiées avant d'être en ligne.", icon: "bouclier" },
      { title: "Énergie solaire", text: "Kits pour la maison et le travail.", icon: "ecran" },
      { title: "Livraison suivie", text: "Pas reçu ? Signalez-le, le SAV intervient.", icon: "camion" },
    ],
    closing: "Équipez-vous en confiance",
    mood: "dynamique",
  }),
  maison: brand("Maison & déco", "terre", {
    headline: "Maison & déco",
    tagline: "Vannerie, mobilier et objets d'artisans.",
    scenes: [
      { title: "Savoir-faire", text: "Des pièces fabriquées à la main.", icon: "outil" },
      { title: "Pour chaque pièce", text: "Salon, chambre, cuisine et extérieur.", icon: "canape" },
      { title: "Durable", text: "Des matériaux choisis pour durer.", icon: "etoile" },
    ],
    closing: "Habillez votre intérieur",
    mood: "chaleureux",
  }),
  alimentation: brand("Épicerie", "vert", {
    headline: "Épicerie",
    tagline: "Café, cacao, épices et produits du terroir.",
    scenes: [
      { title: "Du terroir", text: "Directement des producteurs africains.", icon: "feuille" },
      { title: "Frais", text: "Torréfié, récolté et emballé avec soin.", icon: "panier" },
      { title: "Livré chez vous", text: "Ou payé à la réception, si vous préférez.", icon: "camion" },
    ],
    closing: "Goûtez le meilleur du terroir",
    mood: "chaleureux",
  }),
  immobilier: brand("Immobilier", "or", {
    headline: "Immobilier",
    tagline: "Maisons, appartements et terrains, à louer ou à vendre.",
    scenes: [
      { title: "Visite 360°", text: "Visitez chaque pièce depuis votre téléphone.", icon: "maison" },
      { title: "Agences vérifiées", text: "Chaque vendeur est contrôlé avant de publier.", icon: "cle" },
      { title: "Terrains et villas", text: "De Bamako à Abidjan, au juste prix.", icon: "terrain" },
    ],
    closing: "Trouvez votre prochain chez-vous",
    mood: "élégant",
  }),
  gros: brand("Vente en gros", "violet", {
    headline: "Vente en gros",
    tagline: "Des prix dégressifs pour revendeurs et commerçants.",
    scenes: [
      { title: "Prix de gros", text: "Le tarif baisse tout seul avec la quantité.", icon: "panier" },
      { title: "Gros volumes", text: "Des stocks pour approvisionner votre commerce.", icon: "camion" },
      { title: "Facture fournie", text: "Pour votre comptabilité.", icon: "bouclier" },
    ],
    closing: "Approvisionnez votre commerce",
    mood: "dynamique",
  }),
};

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const names = only.length ? only : Object.keys(SITE_VIDEOS);
  for (const name of names) {
    const script = SITE_VIDEOS[name];
    if (!script) {
      console.error(`vidéo inconnue : ${name} (connues : ${Object.keys(SITE_VIDEOS).join(", ")})`);
      continue;
    }
    const t0 = Date.now();
    const r = await renderVideo(script, out, name);
    console.log(`${name} : ${Math.round(r.bytes / 1024)} Ko, ${r.duration.toFixed(1)} s, rendue en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

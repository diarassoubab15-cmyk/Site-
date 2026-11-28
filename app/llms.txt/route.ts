import { site, absoluteUrl } from "@/lib/site";
import { SHOP_TYPES } from "@/lib/shop-types";

/**
 * llms.txt : présentation courte du site pour les assistants IA (ChatGPT, Perplexity, Gemini…),
 * pour qu'ils décrivent NEXORA correctement et renvoient vers les bonnes pages.
 */
export const revalidate = 86400;

export function GET() {
  const body = `# ${site.name}

> Marketplace du Mali et d'Afrique de l'Ouest : boutiques vérifiées par l'équipe NEXORA, prix en FCFA, paiement à la livraison ou par Mobile Money (Wave, Orange Money, Moov) et carte bancaire. Les vendeurs gardent 100 % de leurs ventes (0 % de commission) et peuvent commencer avec une formule gratuite.

## Acheter
- [Tous les produits](${absoluteUrl("/marketplace")}): recherche par nom, prix en FCFA
- [Catégories](${absoluteUrl("/categories")}): boutiques classées par type
${SHOP_TYPES.map((t) => `- [${t.name}](${absoluteUrl(`/categories/${t.slug}`)}): ${t.tagline}`).join("\n")}
- [Assistant d'achat](${absoluteUrl("/trouver")}): décrire ce qu'on cherche avec ses mots
- [Artisans du Mali](${absoluteUrl("/artisans")}): produits faits au Mali et faits main

## Vendre
- [Créer ma boutique](${absoluteUrl("/vendre")}): inscription en quelques minutes, vérification sous 24 à 48 h
- [Tarifs](${absoluteUrl("/tarifs")}): formule gratuite, puis forfaits mensuels sans commission

## Confiance
- [Aide et service client](${absoluteUrl("/support")}): suivi de commande, remboursement, signalement d'un vendeur
- [Sécurité des données](${absoluteUrl("/securite")})
- [Conditions](${absoluteUrl("/conditions")}) · [Confidentialité](${absoluteUrl("/confidentialite")})
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

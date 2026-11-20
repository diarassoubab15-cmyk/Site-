import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sécurité et protection des données",
  description: "Comment NEXORA protège vos données et vos paiements : vendeurs vérifiés, aucune donnée de carte stockée, connexion par code, chiffrement et contrôle d'accès strict.",
  alternates: { canonical: "/securite" },
};

const items = [
  ["Aucune carte stockée chez nous", "Les numéros de carte et codes Mobile Money sont saisis chez l'opérateur de paiement certifié. NEXORA ne voit jamais votre code secret ni votre numéro complet de carte."],
  ["Connexion sans mot de passe", "Un code à usage unique, valable 10 minutes, est envoyé par e-mail ou SMS. Rien à voler, rien à réutiliser. Les tentatives sont limitées pour bloquer les attaques."],
  ["Chaque donnée a un propriétaire", "Au niveau de la base de données, un vendeur ne peut lire que ses propres commandes, un client que les siennes. Même en cas de bug dans le site, la base refuse l'accès."],
  ["Un seul administrateur", "Le tableau de bord d'administration n'est accessible qu'à un compte unique, verrouillé côté serveur. Toutes ses actions sont journalisées."],
  ["Chiffrement partout", "HTTPS obligatoire (HSTS), données chiffrées au repos, en-têtes de sécurité stricts contre l'injection de scripts et le détournement de clics."],
  ["Vos données vous appartiennent", "Export et suppression en un clic depuis votre compte. À la fermeture d'une boutique, les comptes de paiement associés sont supprimés."],
];

export default function Securite() {
  return (
    <section className="container-x py-16 sm:py-24">
      <p className="eyebrow">Sécurité</p>
      <h1 className="h-section mt-4 max-w-3xl">Vos données ne sont pas un produit.</h1>
      <p className="mt-6 max-w-2xl text-lg text-ash">La sécurité est intégrée à chaque couche : du navigateur à la base de données.</p>
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {items.map(([t, b]) => (
          <article key={t} className="card">
            <h2 className="text-lg font-medium text-white">{t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ash">{b}</p>
          </article>
        ))}
      </div>
      <p className="mt-10 text-sm text-ash">Vous avez trouvé une faille ? Écrivez à <span className="font-mono text-iris">security@nexora.example</span>.</p>
    </section>
  );
}

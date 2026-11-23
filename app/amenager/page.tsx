import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RoomPlanner, type PlannerProduct, type RoomPhoto } from "@/components/RoomPlanner";
import { getProductPage, listCards } from "@/lib/catalog";
import { furnitureTypeOf } from "@/lib/furniture";

export const metadata: Metadata = {
  title: "Aménager ma maison : essayez les meubles chez vous",
  description: "Placez les meubles des vendeurs NEXORA dans votre pièce ou sur la photo de votre logement, puis recevez un devis avec les meilleurs vendeurs.",
  alternates: { canonical: "/amenager" },
};

export default async function Amenager({ searchParams }: { searchParams: Promise<{ bien?: string }> }) {
  const { bien } = await searchParams;
  const [cards, listing] = await Promise.all([
    listCards({ category: "maison", inStock: true }).catch(() => []),
    bien && /^[a-z0-9-]{3,90}$/.test(bien) ? getProductPage(bien).catch(() => null) : Promise.resolve(null),
  ]);
  const products: PlannerProduct[] = cards.map((c) => ({
    slug: c.product.slug, name: c.product.name, price: c.product.price, image: c.product.images?.[0],
    typeId: (furnitureTypeOf(c.product.name) ?? furnitureTypeOf(`${c.product.short} ${c.product.description}`))?.id ?? null,
    shop: { slug: c.shop.slug, name: c.shop.name, city: c.shop.city, payments: c.shop.payments ?? [] },
    rating: c.rating,
  }));
  // Depuis une annonce immobilière : ses photos servent de pièces à meubler.
  const photos: RoomPhoto[] = listing?.product.category === "immobilier"
    ? (listing.product.images ?? []).slice(0, 6).map((url, i) => ({ url, label: `Photo ${i + 1}` }))
    : [];

  return (
    <section className="container-x py-12">
      <Breadcrumbs items={[{ name: "Accueil", href: "/" }, { name: "Meubles & déco", href: "/categories/maison" }, { name: "Aménager ma maison", href: "/amenager" }]} />
      <div className="mb-8 mt-4 max-w-2xl">
        <h1 className="h-section text-4xl sm:text-5xl">Aménagez votre maison</h1>
        <p className="mt-4 text-ash">
          {listing && photos.length
            ? <>Meublez « {listing.product.name} » : choisissez une photo, puis posez les meubles.</>
            : <>Choisissez une pièce ou prenez la vôtre en photo, posez les meubles des vendeurs, déplacez-les du doigt. Touchez « Confirmer » : vous recevez le devis et les meilleurs vendeurs.</>}
        </p>
        <p className="mt-2 text-xs text-iron">Votre photo reste sur votre téléphone : elle n&apos;est jamais envoyée.</p>
      </div>
      <RoomPlanner products={products} photos={photos} />
    </section>
  );
}

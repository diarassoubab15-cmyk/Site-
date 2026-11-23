"use client";
import { subcategoriesOf } from "@/lib/subcategories";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { categories } from "@/lib/data";
import { toast } from "@/lib/toast";
import type { SellerProduct } from "@/lib/server-data";
import { deleteProduct, saveProduct } from "@/app/actions";

const num = (v: string) => (v.trim() === "" ? null : Math.round(Number(v.replace(/\s/g, ""))));

/** Formulaire produit du vendeur (création et modification). */
export function ProductEditor({ product }: { product?: SellerProduct }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [category, setCategory] = useState(product?.category ?? "mode");
  const [specs, setSpecs] = useState<[string, string][]>(product?.specs?.length ? product.specs : [["", ""]]);
  const immobilier = category === "immobilier";
  const subs = subcategoriesOf(category);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "");
    const payload = {
      id: product?.id,
      name: s("name"),
      category: category as "mode",
      subcategory: subs.length ? s("subcategory") || null : null,
      price: num(s("price")) ?? 0,
      priceUnit: immobilier && s("priceUnit") ? (s("priceUnit") as "mois") : null,
      compareAt: num(s("compareAt")),
      stock: num(s("stock")) ?? 0,
      short: s("short"),
      description: s("description"),
      specs: specs.filter(([k, v]) => k.trim() && v.trim()),
      wholesaleMin: immobilier ? null : num(s("wholesaleMin")),
      wholesalePrice: immobilier ? null : num(s("wholesalePrice")),
      published: f.get("published") === "on",
    };
    start(async () => {
      const r = await saveProduct(payload);
      if (!r.ok) return toast(r.error, "error");
      toast(product ? "Produit enregistré" : "Produit créé : ajoutez maintenant vos photos");
      if (!product && r.data) router.push(`/vendeur/produits/${r.data.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">{immobilier ? "Titre de l'annonce" : "Nom du produit"}</label>
          <input id="name" name="name" required minLength={2} maxLength={120} defaultValue={product?.name} className="input" placeholder={immobilier ? "Ex. Villa 4 pièces à l'ACI 2000" : "Ex. Robe wax Sanaa"} />
        </div>
        <div>
          <label className="label" htmlFor="category">Catégorie</label>
          <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        {subs.length > 0 && (
          <div>
            <label className="label" htmlFor="subcategory">Type de produit</label>
            <select id="subcategory" name="subcategory" className="input" defaultValue={product?.subcategory ?? ""} key={category}>
              <option value="">Choisir (ordinateur, télévision…)</option>
              {subs.map((x) => <option key={x.slug} value={x.slug}>{x.icon} {x.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="price">{immobilier ? "Prix ou loyer (FCFA)" : "Prix (FCFA)"}</label>
          <div className="flex gap-2">
            <input id="price" name="price" required inputMode="numeric" pattern="[0-9 ]+" defaultValue={product?.price} className="input font-mono" />
            {immobilier && (
              <select name="priceUnit" defaultValue={product?.priceUnit ?? "mois"} className="input w-32" aria-label="Unité">
                <option value="">à la vente</option>
                <option value="mois">/ mois</option>
                <option value="nuit">/ nuit</option>
                <option value="jour">/ jour</option>
              </select>
            )}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="stock">{immobilier ? "Biens disponibles" : "Stock"}</label>
          <input id="stock" name="stock" required inputMode="numeric" pattern="[0-9]+" defaultValue={product?.stock ?? 1} className="input font-mono" />
        </div>
        <div>
          <label className="label" htmlFor="compareAt">Ancien prix (facultatif)</label>
          <input id="compareAt" name="compareAt" inputMode="numeric" pattern="[0-9 ]*" defaultValue={product?.compareAt ?? ""} className="input font-mono" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="short">Accroche (une phrase)</label>
          <input id="short" name="short" maxLength={200} defaultValue={product?.short} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={6} maxLength={5000} defaultValue={product?.description} className="input" placeholder={immobilier ? "Quartier, nombre de pièces, surface, état, conditions (caution, avance)…" : "Matière, dimensions, entretien, garantie…"} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="label">{immobilier ? "Caractéristiques (pièces, surface, quartier…)" : "Caractéristiques"}</legend>
        {specs.map(([k, v], i) => (
          <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
            <input aria-label="Caractéristique" className="input" maxLength={40} placeholder={immobilier ? "Pièces" : "Matière"} value={k} onChange={(e) => setSpecs(specs.map((s, j) => (j === i ? [e.target.value, s[1]] : s)))} />
            <input aria-label="Valeur" className="input" maxLength={120} placeholder={immobilier ? "4 (dont 3 chambres)" : "Coton"} value={v} onChange={(e) => setSpecs(specs.map((s, j) => (j === i ? [s[0], e.target.value] : s)))} />
            <button type="button" className="btn px-3" aria-label="Retirer la ligne" onClick={() => setSpecs(specs.length > 1 ? specs.filter((_, j) => j !== i) : [["", ""]])}>×</button>
          </div>
        ))}
        {specs.length < 20 && <button type="button" className="text-sm text-ash hover:text-white" onClick={() => setSpecs([...specs, ["", ""]])}>+ Ajouter une ligne</button>}
      </fieldset>

      {!immobilier && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="wholesaleMin">Prix de gros : à partir de (unités)</label><input id="wholesaleMin" name="wholesaleMin" inputMode="numeric" pattern="[0-9]*" defaultValue={product?.wholesaleMin ?? ""} className="input font-mono" /></div>
          <div><label className="label" htmlFor="wholesalePrice">Prix de gros unitaire (FCFA)</label><input id="wholesalePrice" name="wholesalePrice" inputMode="numeric" pattern="[0-9 ]*" defaultValue={product?.wholesalePrice ?? ""} className="input font-mono" /></div>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm text-bone">
        <input type="checkbox" name="published" defaultChecked={product?.published ?? true} className="accent-[#5433eb]" />
        Visible sur la marketplace
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex gap-2">
          <button className="btn-solid" data-haptic disabled={pending}>{pending ? "Enregistrement…" : product ? "Enregistrer" : "Créer le produit"}</button>
          <Link href="/vendeur/produits" className="btn">Retour</Link>
        </div>
        {product && (
          <button
            type="button"
            className="btn-danger"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Supprimer définitivement « ${product.name} » et ses photos ?`)) return;
              start(async () => {
                const r = await deleteProduct({ id: product.id });
                if (!r.ok) return toast(r.error, "error");
                toast("Produit supprimé");
                router.push("/vendeur/produits");
              });
            }}
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}

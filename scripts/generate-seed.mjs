// Génère supabase/seed.sql à partir des données de démo (lib/data.ts) : une seule source de vérité.
// Usage : node scripts/generate-seed.mjs
import { writeFileSync } from "node:fs";
import { shops, products, reviews } from "../lib/data.ts";

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const shopId = (i) => `5000000${i}-0000-4000-8000-000000000000`;
const ownerId = (i) => `a000000${i}-0000-4000-8000-000000000000`;
const prodId = (i) => `6${String(i).padStart(7, "0")}-0000-4000-8000-000000000000`;

let sql = `-- Généré par scripts/generate-seed.mjs. Ne pas modifier à la main.
-- Données de démonstration (boutiques, produits, avis). À ne PAS charger en production.

`;
// Vendeurs (comptes de démonstration). Les champs de jetons doivent valoir '' (et non NULL) pour que la connexion fonctionne.
shops.forEach((s, i) => {
  sql += `insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
values ('00000000-0000-0000-0000-000000000000', '${ownerId(i)}', 'authenticated', 'authenticated', 'vendeur${i + 1}@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '');\n`;
  sql += `update profiles set role = 'seller', full_name = ${q(s.name)}, city = ${q(s.city)}, country = ${q(s.country)} where id = '${ownerId(i)}';\n`;
  const online = s.payments.filter((m) => m !== "cash_on_delivery");
  sql += `insert into shops (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, owner_name, contact_email, response_time, payments, created_at)
values ('${shopId(i)}', '${ownerId(i)}', ${q(s.slug)}, ${q(s.name)}, ${q(s.description)}, ${q(products.find((p) => p.shop === s.slug)?.category ?? "mode")}, ${q(s.city)}, ${q(s.country)}, ${s.acceptsCashOnDelivery}, 'approved', ${q(s.name)}, 'vendeur${i + 1}@demo.nexora', ${q(s.responseTime)}, '{${online.join(",")}}', ${q(s.since)});\n`;
  sql += `insert into subscriptions (shop_id, plan, active) values ('${shopId(i)}', 'pro', true);\n\n`;
});

// Produits
products.forEach((p, i) => {
  const si = shops.findIndex((s) => s.slug === p.shop);
  sql += `insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('${prodId(i)}', '${shopId(si)}', ${q(p.slug)}, ${q(p.name)}, ${q(p.short)}, ${q(p.description)}, ${q(p.category)}, ${p.price}, ${p.compareAt ?? "null"}, ${p.stock + 50}, ${p.wholesale?.minQty ?? "null"}, ${p.wholesale?.price ?? "null"}, ${q(JSON.stringify(p.specs))}, ${q(p.glyph)}, ${q(p.tone)});\n`;
});
sql += "\n";

// Avis : chaque avis repose sur une vraie commande livrée d'un acheteur de démonstration.
reviews.forEach((r, i) => {
  const pi = products.findIndex((p) => p.slug === r.product);
  const p = products[pi];
  const si = shops.findIndex((s) => s.slug === p.shop);
  const buyer = `b${String(i).padStart(7, "0")}-0000-4000-8000-000000000000`;
  const order = `c${String(i).padStart(7, "0")}-0000-4000-8000-000000000000`;
  const [first, last = ""] = r.author.split(" ");
  const method = shops[si].acceptsCashOnDelivery ? "cash_on_delivery" : shops[si].payments[0];
  sql += `insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
values ('00000000-0000-0000-0000-000000000000', '${buyer}', 'authenticated', 'authenticated', 'client${i + 1}@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '', '', '', '', '');
update profiles set full_name = ${q(`${first} ${last.replace(".", "")}`.trim())}, city = ${q(r.city)} where id = '${buyer}';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('${order}', '${buyer}', '${shopId(si)}', '${prodId(pi)}', 1, 1, '${method}', ${q(r.author)}, '+000', ${q(r.city)}, ${q(r.date)});
update orders set status = 'delivered' where id = '${order}'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('${order}', '${prodId(pi)}', '${buyer}', ${r.rating}, ${q(r.title)}, ${q(r.body)}, ${q(r.sellerReply)}, ${q(r.date)});\n\n`;
});

// Restaure les stocks d'origine (les commandes de démo les ont décrémentés).
products.forEach((p, i) => (sql += `update products set stock = ${p.stock} where id = '${prodId(i)}';\n`));

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log(`seed.sql : ${shops.length} boutiques, ${products.length} produits, ${reviews.length} avis`);

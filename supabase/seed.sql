-- Généré par scripts/generate-seed.mjs. Ne pas modifier à la main.
-- Données de démonstration (boutiques, produits, avis). À ne PAS charger en production.

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'vendeur1@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set role = 'seller', full_name = 'Atelier Kenté', city = 'Abidjan', country = 'Côte d''Ivoire' where id = 'a0000000-0000-4000-8000-000000000000';
insert into shops (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, owner_name, contact_email, response_time, payments, created_at)
values ('50000000-0000-4000-8000-000000000000', 'a0000000-0000-4000-8000-000000000000', 'atelier-kente', 'Atelier Kenté', 'Créations en wax et bazin cousues à la main à Treichville depuis 2016.', 'mode', 'Abidjan', 'Côte d''Ivoire', true, 'approved', 'Atelier Kenté', 'vendeur1@demo.nexora', 'répond en ~1 h', '{orange_money,wave,mtn_momo,card}', '2024-02-11');
insert into subscriptions (shop_id, plan, active) values ('50000000-0000-4000-8000-000000000000', 'pro', true);

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'vendeur2@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set role = 'seller', full_name = 'Karité de Koudougou', city = 'Koudougou', country = 'Burkina Faso' where id = 'a0000001-0000-4000-8000-000000000000';
insert into shops (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, owner_name, contact_email, response_time, payments, created_at)
values ('50000001-0000-4000-8000-000000000000', 'a0000001-0000-4000-8000-000000000000', 'karite-de-koudougou', 'Karité de Koudougou', 'Coopérative de 40 femmes productrices de beurre de karité brut et de savons.', 'beaute', 'Koudougou', 'Burkina Faso', true, 'approved', 'Karité de Koudougou', 'vendeur2@demo.nexora', 'répond en ~3 h', '{orange_money,moov_money,card}', '2024-05-03');
insert into subscriptions (shop_id, plan, active) values ('50000001-0000-4000-8000-000000000000', 'pro', true);

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'a0000002-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'vendeur3@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set role = 'seller', full_name = 'Dakar Tech', city = 'Dakar', country = 'Sénégal' where id = 'a0000002-0000-4000-8000-000000000000';
insert into shops (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, owner_name, contact_email, response_time, payments, created_at)
values ('50000002-0000-4000-8000-000000000000', 'a0000002-0000-4000-8000-000000000000', 'dakar-tech', 'Dakar Tech', 'Accessoires téléphone, kits solaires et électronique garantie 12 mois.', 'electronique', 'Dakar', 'Sénégal', true, 'approved', 'Dakar Tech', 'vendeur3@demo.nexora', 'répond en ~30 min', '{wave,orange_money,card}', '2023-11-20');
insert into subscriptions (shop_id, plan, active) values ('50000002-0000-4000-8000-000000000000', 'pro', true);

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'a0000003-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'vendeur4@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set role = 'seller', full_name = 'Maison Bamako', city = 'Bamako', country = 'Mali' where id = 'a0000003-0000-4000-8000-000000000000';
insert into shops (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, owner_name, contact_email, response_time, payments, created_at)
values ('50000003-0000-4000-8000-000000000000', 'a0000003-0000-4000-8000-000000000000', 'maison-bamako', 'Maison Bamako', 'Bogolan, vannerie et mobilier fabriqués par des artisans maliens.', 'maison', 'Bamako', 'Mali', false, 'approved', 'Maison Bamako', 'vendeur4@demo.nexora', 'répond en ~4 h', '{orange_money,moov_money,card}', '2024-08-14');
insert into subscriptions (shop_id, plan, active) values ('50000003-0000-4000-8000-000000000000', 'pro', true);

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'a0000004-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'vendeur5@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set role = 'seller', full_name = 'Terroir du Cameroun', city = 'Douala', country = 'Cameroun' where id = 'a0000004-0000-4000-8000-000000000000';
insert into shops (id, owner_id, slug, name, description, category, city, country, accepts_cod, status, owner_name, contact_email, response_time, payments, created_at)
values ('50000004-0000-4000-8000-000000000000', 'a0000004-0000-4000-8000-000000000000', 'terroir-cameroun', 'Terroir du Cameroun', 'Café de l''Ouest, poivre de Penja et cacao en direct des producteurs.', 'alimentation', 'Douala', 'Cameroun', true, 'approved', 'Terroir du Cameroun', 'vendeur5@demo.nexora', 'répond en ~2 h', '{mtn_momo,orange_money,card}', '2024-01-09');
insert into subscriptions (shop_id, plan, active) values ('50000004-0000-4000-8000-000000000000', 'pro', true);

insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000000-0000-4000-8000-000000000000', '50000000-0000-4000-8000-000000000000', 'robe-wax-sanaa', 'Robe wax Sanaa', 'Robe midi en wax 100 % coton, coupe évasée, poches latérales.', 'La robe Sanaa est coupée dans un wax 100 % coton à motifs géométriques, doublée au buste. Sa coupe évasée se porte au bureau comme en cérémonie. Chaque pièce est cousue à la main dans notre atelier d''Abidjan : les motifs peuvent légèrement varier d''une robe à l''autre.', 'mode', 18500, 22000, 64, null, null, '[["Matière","Wax 100 % coton"],["Tailles","S à XXL"],["Entretien","Lavage 30 °C, à l''envers"],["Fabrication","Abidjan, Côte d''Ivoire"]]', '◆', '#9281f7');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000001-0000-4000-8000-000000000000', '50000000-0000-4000-8000-000000000000', 'chemise-bazin-brode', 'Chemise bazin brodé', 'Bazin riche teint à la main, broderie ton sur ton au col.', 'Chemise homme en bazin riche teint à la main, broderie fine au col et aux poignets. Coupe droite, manches longues. Idéale pour les fêtes et les mariages.', 'mode', 24000, null, 56, null, null, '[["Matière","Bazin riche"],["Tailles","M à 3XL"],["Entretien","Lavage à la main"],["Fabrication","Abidjan, Côte d''Ivoire"]]', '◇', '#70b8ff');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000002-0000-4000-8000-000000000000', '50000001-0000-4000-8000-000000000000', 'beurre-karite-brut-500g', 'Beurre de karité brut 500 g', 'Karité non raffiné, pressé à froid, sans parfum ajouté.', 'Beurre de karité brut extrait à la main par la coopérative, filtré et conditionné en pot de 500 g. Il nourrit la peau et les cheveux. Sans conservateur ni parfum.', 'beaute', 4500, null, 170, 20, 3200, '[["Poids","500 g"],["Origine","Koudougou, Burkina Faso"],["Composition","100 % Butyrospermum parkii"],["Conservation","24 mois, à l''abri de la chaleur"]]', '✦', '#ffca16');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000003-0000-4000-8000-000000000000', '50000001-0000-4000-8000-000000000000', 'savon-noir-karite', 'Savon noir au karité (lot de 3)', 'Savon traditionnel saponifié à froid, enrichi en karité.', 'Trois pains de savon noir fabriqués à partir de cendres végétales et de beurre de karité. Convient au visage, au corps et aux peaux sensibles.', 'beaute', 3000, null, 250, 50, 2100, '[["Contenu","3 × 150 g"],["Origine","Burkina Faso"],["Peau","Tous types"]]', '●', '#3ad389');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000004-0000-4000-8000-000000000000', '50000002-0000-4000-8000-000000000000', 'kit-solaire-maison-100w', 'Kit solaire maison 100 W', 'Panneau 100 W, batterie lithium, 4 ampoules LED et ports USB.', 'Kit complet pour éclairer une maison et recharger les téléphones : panneau monocristallin 100 W, batterie lithium 30 Ah, 4 ampoules LED avec câbles et 2 ports USB. Installation sans électricien. Garantie 12 mois assurée par le vendeur.', 'electronique', 89000, 99000, 59, null, null, '[["Panneau","100 W monocristallin"],["Batterie","Lithium 12 V 30 Ah"],["Autonomie","≈ 10 h d''éclairage"],["Garantie","12 mois vendeur"]]', '☀', '#ffd60a');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000005-0000-4000-8000-000000000000', '50000002-0000-4000-8000-000000000000', 'batterie-externe-20000', 'Batterie externe 20 000 mAh', 'Charge rapide USB-C 22,5 W, deux sorties, écran de charge.', 'Batterie externe 20 000 mAh, charge rapide 22,5 W en USB-C, 2 sorties USB-A, affichage du niveau. Recharge un smartphone 4 à 5 fois.', 'electronique', 15000, null, 90, 10, 11500, '[["Capacité","20 000 mAh"],["Charge","22,5 W USB-C PD"],["Poids","380 g"],["Garantie","12 mois vendeur"]]', '▣', '#3b9eff');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000006-0000-4000-8000-000000000000', '50000003-0000-4000-8000-000000000000', 'panier-tresse-bamako', 'Panier tressé de Bamako', 'Panier de rangement en fibres végétales, tressé à la main.', 'Grand panier rond tressé en fibres de palmier, anses en cuir. Parfait pour le linge, les jouets ou les plantes. Chaque panier est unique.', 'maison', 12000, null, 68, null, null, '[["Diamètre","40 cm"],["Hauteur","45 cm"],["Matière","Palmier et cuir"],["Fabrication","Bamako, Mali"]]', '⌂', '#ff9592');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000007-0000-4000-8000-000000000000', '50000003-0000-4000-8000-000000000000', 'plaid-bogolan', 'Plaid bogolan', 'Tissu teint à la terre selon la technique traditionnelle.', 'Plaid en coton tissé main et teint à la terre selon la technique du bogolan. Motifs symboliques peints à la main. Se pose sur un canapé ou au mur.', 'maison', 27500, null, 55, null, null, '[["Dimensions","140 × 200 cm"],["Matière","Coton tissé main"],["Entretien","Lavage à froid, à la main"]]', '▦', '#baa7ff');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000008-0000-4000-8000-000000000000', '50000004-0000-4000-8000-000000000000', 'cafe-arabica-ouest-1kg', 'Café arabica de l''Ouest 1 kg', 'Grains torréfiés la semaine de l''envoi, notes de cacao.', 'Café arabica cultivé en altitude dans l''Ouest du Cameroun, torréfié artisanalement à Douala la semaine de l''expédition. Disponible en grains ou moulu.', 'alimentation', 9500, null, 110, 25, 7400, '[["Poids","1 kg"],["Torréfaction","Moyenne"],["Origine","Ouest, Cameroun"]]', '❋', '#ff6465');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000009-0000-4000-8000-000000000000', '50000004-0000-4000-8000-000000000000', 'poivre-penja-blanc', 'Poivre blanc de Penja 100 g', 'Poivre à indication géographique, cultivé sur sol volcanique.', 'Le poivre blanc de Penja pousse sur les sols volcaniques du Moungo. Arômes intenses et légèrement musqués. Sachet refermable de 100 g.', 'alimentation', 6500, null, 130, null, null, '[["Poids","100 g"],["Origine","Penja, Cameroun"],["Label","Indication géographique protégée"]]', '∴', '#f0f0f0');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000010-0000-4000-8000-000000000000', '50000000-0000-4000-8000-000000000000', 'lot-pagnes-wax-12', 'Lot de 12 pagnes wax (revendeurs)', '12 pièces de 6 yards, motifs assortis, pour revendeurs.', 'Lot de 12 pagnes wax de 6 yards en motifs assortis. Prix dégressif à partir de 5 lots. Facture fournie pour les commerçants.', 'gros', 96000, null, 80, 5, 84000, '[["Contenu","12 × 6 yards"],["Matière","Coton"],["Facture","Oui"]]', '▤', '#9281f7');
insert into products (id, shop_id, slug, name, short, description, category, price, compare_at, stock, wholesale_min, wholesale_price, specs, glyph, tone)
values ('60000011-0000-4000-8000-000000000000', '50000002-0000-4000-8000-000000000000', 'ecouteurs-sans-fil-pro', 'Écouteurs sans fil Pro', 'Réduction de bruit, 30 h d''autonomie avec le boîtier.', 'Écouteurs Bluetooth 5.3 avec réduction de bruit active, résistance à la sueur et 30 h d''autonomie avec le boîtier de charge.', 'electronique', 21000, null, 50, null, null, '[["Bluetooth","5.3"],["Autonomie","30 h avec boîtier"],["Garantie","12 mois vendeur"]]', '◎', '#70b8ff');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client1@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Aïcha K', city = 'Abidjan' where id = 'b0000000-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000000-0000-4000-8000-000000000000', 'b0000000-0000-4000-8000-000000000000', '50000000-0000-4000-8000-000000000000', '60000000-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Aïcha K.', '+000', 'Abidjan', '2026-10-02');
update orders set status = 'delivered' where id = 'c0000000-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000000-0000-4000-8000-000000000000', '60000000-0000-4000-8000-000000000000', 'b0000000-0000-4000-8000-000000000000', 5, 'Magnifique et bien cousue', 'La robe est encore plus belle qu''en photo, les finitions sont propres. J''ai payé à la livraison, le livreur était à l''heure.', 'Merci Aïcha, au plaisir de vous habiller à nouveau !', '2026-10-02');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000001-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client2@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Mariam D', city = 'Bouaké' where id = 'b0000001-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000001-0000-4000-8000-000000000000', 'b0000001-0000-4000-8000-000000000000', '50000000-0000-4000-8000-000000000000', '60000000-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Mariam D.', '+000', 'Bouaké', '2026-09-18');
update orders set status = 'delivered' where id = 'c0000001-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000001-0000-4000-8000-000000000000', '60000000-0000-4000-8000-000000000000', 'b0000001-0000-4000-8000-000000000000', 4, 'Taille un peu grand', 'Très joli tissu. Prenez une taille en dessous. Le vendeur a accepté l''échange sans discuter.', null, '2026-09-18');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000002-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client3@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Fatou S', city = 'Dakar' where id = 'b0000002-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000002-0000-4000-8000-000000000000', 'b0000002-0000-4000-8000-000000000000', '50000001-0000-4000-8000-000000000000', '60000002-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Fatou S.', '+000', 'Dakar', '2026-10-21');
update orders set status = 'delivered' where id = 'c0000002-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000002-0000-4000-8000-000000000000', '60000002-0000-4000-8000-000000000000', 'b0000002-0000-4000-8000-000000000000', 5, 'Vrai karité brut', 'Odeur naturelle, texture parfaite. Payé avec Wave en deux clics.', null, '2026-10-21');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000003-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client4@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Jean-Marc O', city = 'Lomé' where id = 'b0000003-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000003-0000-4000-8000-000000000000', 'b0000003-0000-4000-8000-000000000000', '50000001-0000-4000-8000-000000000000', '60000002-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Jean-Marc O.', '+000', 'Lomé', '2026-08-30');
update orders set status = 'delivered' where id = 'c0000003-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000003-0000-4000-8000-000000000000', '60000002-0000-4000-8000-000000000000', 'b0000003-0000-4000-8000-000000000000', 5, 'Commande en gros sans souci', 'J''ai pris 30 pots pour ma boutique, le prix de gros s''applique tout seul au panier.', null, '2026-08-30');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000004-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client5@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Moussa T', city = 'Thiès' where id = 'b0000004-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000004-0000-4000-8000-000000000000', 'b0000004-0000-4000-8000-000000000000', '50000002-0000-4000-8000-000000000000', '60000004-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Moussa T.', '+000', 'Thiès', '2026-10-11');
update orders set status = 'delivered' where id = 'c0000004-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000004-0000-4000-8000-000000000000', '60000004-0000-4000-8000-000000000000', 'b0000004-0000-4000-8000-000000000000', 4, 'Fonctionne bien', 'Installé en une heure. Une ampoule défectueuse, remplacée par le vendeur en 3 jours.', 'Désolé pour l''ampoule, merci pour votre patience.', '2026-10-11');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000005-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client6@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Clarisse B', city = 'Ziguinchor' where id = 'b0000005-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000005-0000-4000-8000-000000000000', 'b0000005-0000-4000-8000-000000000000', '50000002-0000-4000-8000-000000000000', '60000004-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Clarisse B.', '+000', 'Ziguinchor', '2026-09-05');
update orders set status = 'delivered' where id = 'c0000005-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000005-0000-4000-8000-000000000000', '60000004-0000-4000-8000-000000000000', 'b0000005-0000-4000-8000-000000000000', 5, 'Enfin de la lumière le soir', 'La batterie tient toute la nuit. Livraison en 4 jours.', null, '2026-09-05');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000006-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client7@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Paul E', city = 'Yaoundé' where id = 'b0000006-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000006-0000-4000-8000-000000000000', 'b0000006-0000-4000-8000-000000000000', '50000004-0000-4000-8000-000000000000', '60000008-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Paul E.', '+000', 'Yaoundé', '2026-10-28');
update orders set status = 'delivered' where id = 'c0000006-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000006-0000-4000-8000-000000000000', '60000008-0000-4000-8000-000000000000', 'b0000006-0000-4000-8000-000000000000', 5, 'Excellent café', 'Torréfaction récente, ça se sent. Je recommande en grains.', null, '2026-10-28');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000007-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client8@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Ibrahima N', city = 'Dakar' where id = 'b0000007-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000007-0000-4000-8000-000000000000', 'b0000007-0000-4000-8000-000000000000', '50000002-0000-4000-8000-000000000000', '60000005-0000-4000-8000-000000000000', 1, 1, 'cash_on_delivery', 'Ibrahima N.', '+000', 'Dakar', '2026-09-12');
update orders set status = 'delivered' where id = 'c0000007-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000007-0000-4000-8000-000000000000', '60000005-0000-4000-8000-000000000000', 'b0000007-0000-4000-8000-000000000000', 3, 'Correct', 'Charge bien mais un peu lourde. Conforme à la description.', null, '2026-09-12');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000008-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client9@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Sophie M', city = 'Abidjan' where id = 'b0000008-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000008-0000-4000-8000-000000000000', 'b0000008-0000-4000-8000-000000000000', '50000003-0000-4000-8000-000000000000', '60000006-0000-4000-8000-000000000000', 1, 1, 'orange_money', 'Sophie M.', '+000', 'Abidjan', '2026-10-15');
update orders set status = 'delivered' where id = 'c0000008-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000008-0000-4000-8000-000000000000', '60000006-0000-4000-8000-000000000000', 'b0000008-0000-4000-8000-000000000000', 5, 'Très beau travail', 'Solide et joli, bien emballé.', null, '2026-10-15');

insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000009-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'client10@demo.nexora', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
update profiles set full_name = 'Awa C', city = 'Bamako' where id = 'b0000009-0000-4000-8000-000000000000';
insert into orders (id, buyer_id, shop_id, product_id, qty, total, method, shipping_name, shipping_phone, shipping_city, created_at)
values ('c0000009-0000-4000-8000-000000000000', 'b0000009-0000-4000-8000-000000000000', '50000003-0000-4000-8000-000000000000', '60000007-0000-4000-8000-000000000000', 1, 1, 'orange_money', 'Awa C.', '+000', 'Bamako', '2026-07-22');
update orders set status = 'delivered' where id = 'c0000009-0000-4000-8000-000000000000'; -- paiement en ligne confirmé puis livré
insert into reviews (order_id, product_id, author_id, rating, title, body, seller_reply, created_at)
values ('c0000009-0000-4000-8000-000000000000', '60000007-0000-4000-8000-000000000000', 'b0000009-0000-4000-8000-000000000000', 5, 'Superbe', 'Les motifs sont magnifiques, très bonne qualité de coton.', null, '2026-07-22');

update products set stock = 14 where id = '60000000-0000-4000-8000-000000000000';
update products set stock = 6 where id = '60000001-0000-4000-8000-000000000000';
update products set stock = 120 where id = '60000002-0000-4000-8000-000000000000';
update products set stock = 200 where id = '60000003-0000-4000-8000-000000000000';
update products set stock = 9 where id = '60000004-0000-4000-8000-000000000000';
update products set stock = 40 where id = '60000005-0000-4000-8000-000000000000';
update products set stock = 18 where id = '60000006-0000-4000-8000-000000000000';
update products set stock = 5 where id = '60000007-0000-4000-8000-000000000000';
update products set stock = 60 where id = '60000008-0000-4000-8000-000000000000';
update products set stock = 80 where id = '60000009-0000-4000-8000-000000000000';
update products set stock = 30 where id = '60000010-0000-4000-8000-000000000000';
update products set stock = 0 where id = '60000011-0000-4000-8000-000000000000';

-- NEXORA · moyen de paiement préféré de l'acheteur (Réglages), présélectionné à chaque achat.
alter table profiles add column preferred_payment payment_method;

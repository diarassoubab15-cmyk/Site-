-- Formule gratuite « Découverte » (1/2) : nouvelle valeur du forfait.
-- Ajoutée seule : PostgreSQL n'autorise pas l'usage d'une nouvelle valeur d'énumération dans la même transaction.
alter type plan_id add value if not exists 'decouverte' before 'essentiel';

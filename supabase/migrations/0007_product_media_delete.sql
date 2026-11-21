-- NEXORA · suppression réelle des fichiers de produits par leur vendeur
--
-- La suppression d'un fichier par l'API de stockage lit d'abord la ligne (SELECT) : sans règle de
-- lecture, rien n'était trouvé, rien n'était supprimé, et aucune erreur n'était signalée.
-- Le vendeur peut lire les lignes de fichiers du dossier de SA boutique (les fichiers eux-mêmes
-- restent publics par leur adresse, comme avant).
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'objects') then
    execute $p$
      create policy "product-media : lecture par le vendeur" on storage.objects for select to authenticated using (
        bucket_id = 'product-media'
        and (storage.foldername(name))[1] in (select id::text from public.shops where owner_id = auth.uid()))
    $p$;
  end if;
end $$;

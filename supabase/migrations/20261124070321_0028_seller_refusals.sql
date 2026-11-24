-- Pour chaque commande de la boutique du vendeur connecté : nombre de colis que ce client a refusés sur NEXORA.
create or replace function seller_order_refusals() returns table (order_id uuid, refusals int)
language sql stable security definer set search_path = public as $$
  select o.id, (select count(*)::int from orders r where r.buyer_id = o.buyer_id and r.refused_at is not null)
  from orders o join shops s on s.id = o.shop_id
  where s.owner_id = auth.uid() and o.buyer_id is not null
  order by o.created_at desc limit 200;
$$;
revoke execute on function seller_order_refusals() from public, anon;
grant execute on function seller_order_refusals() to authenticated;

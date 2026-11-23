-- 1. Paiement Orange Money / Wave directement au vendeur : son numéro d'encaissement est donné à l'acheteur
--    après sa commande (et seulement à lui, pour cette commande).
-- 2. Sous-catégories des produits (Technologie : ordinateurs, téléviseurs, consoles…).
-- 3. Commentaires publics sur les boutiques, avec réponse du vendeur.
-- 4. Boutique signalée par un client : suspendue aussitôt, jusqu'à ce que l'administrateur l'autorise de nouveau.

-- ------------------------------------------------------------------ 1. numéro d'encaissement
alter table payout_accounts add column if not exists pay_number text check (pay_number is null or pay_number ~ '^[+0-9 ]{6,40}$');

create or replace function order_pay_info(p_ref text)
returns table (shop_name text, method payment_method, total int, pay_number text, pay_type payout_type, whatsapp text)
language sql stable security definer set search_path = public as $$
  select s.name, o.method, o.total,
         coalesce(pa_same.pay_number, pa_any.pay_number),
         coalesce(pa_same.type, pa_any.type),
         s.whatsapp
  from orders o
  join shops s on s.id = o.shop_id
  left join lateral (select pay_number, type from payout_accounts where shop_id = s.id and type::text = o.method::text and pay_number is not null order by created_at desc limit 1) pa_same on true
  left join lateral (select pay_number, type from payout_accounts where shop_id = s.id and type in ('orange_money', 'wave', 'mtn_momo', 'moov_money') and pay_number is not null order by created_at desc limit 1) pa_any on true
  where o.ref = p_ref and o.buyer_id = auth.uid();
$$;
revoke execute on function order_pay_info(text) from public, anon;
grant execute on function order_pay_info(text) to authenticated;

-- ------------------------------------------------------------------ 2. sous-catégories
alter table products add column if not exists subcategory text check (subcategory is null or subcategory ~ '^[a-z0-9-]{2,30}$');
create index if not exists products_subcategory_idx on products (category, subcategory) where published;

-- ------------------------------------------------------------------ 3. commentaires des boutiques
create table if not exists shop_comments (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references shops on delete cascade,
  author_id    uuid references profiles on delete set null,
  author_name  text not null check (char_length(author_name) between 1 and 60),
  body         text not null check (char_length(body) between 3 and 800),
  rating       smallint check (rating between 1 and 5),
  seller_reply text check (char_length(seller_reply) <= 800),
  hidden       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists shop_comments_shop_idx on shop_comments (shop_id, created_at desc);
alter table shop_comments enable row level security;

create policy "commentaires : visibles avec la boutique" on shop_comments for select
  using ((not hidden and exists (select 1 from shops s where s.id = shop_id and s.status = 'approved'))
         or is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "commentaires : un client connecté" on shop_comments for insert to authenticated
  with check (author_id = auth.uid() and seller_reply is null and not hidden
              and not exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "commentaires : l'auteur supprime le sien" on shop_comments for delete using (author_id = auth.uid() or is_admin());

-- Nom affiché pris du profil (impossible de se faire passer pour un autre) ; 3 commentaires par jour et par boutique au plus.
create or replace function shop_comment_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select coalesce(nullif(split_part(trim(full_name), ' ', 1) || coalesce(' ' || left(nullif(split_part(trim(full_name), ' ', 2), ''), 1) || '.', ''), ''), 'Client')
    into new.author_name from profiles where id = new.author_id;
  new.author_name := coalesce(new.author_name, 'Client');
  if (select count(*) from shop_comments where shop_id = new.shop_id and author_id = new.author_id and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Trop de commentaires aujourd''hui pour cette boutique';
  end if;
  return new;
end $$;
drop trigger if exists shop_comment_guard on shop_comments;
create trigger shop_comment_guard before insert on shop_comments for each row execute function shop_comment_guard();

-- Le vendeur répond (une réponse, modifiable) ; l'admin masque ou réaffiche.
create or replace function reply_shop_comment(p_comment uuid, p_reply text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(coalesce(p_reply, '')) > 800 then raise exception 'Réponse trop longue'; end if;
  update shop_comments c set seller_reply = nullif(trim(p_reply), '')
    where c.id = p_comment and exists (select 1 from shops s where s.id = c.shop_id and s.owner_id = auth.uid());
  if not found then raise exception 'Commentaire introuvable'; end if;
end $$;
revoke execute on function reply_shop_comment(uuid, text) from public, anon;
grant execute on function reply_shop_comment(uuid, text) to authenticated;

create or replace function admin_hide_shop_comment(p_comment uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update shop_comments set hidden = p_hidden where id = p_comment;
  insert into admin_audit (actor_id, action, target, details) values (auth.uid(), 'comment_hidden', p_comment::text, jsonb_build_object('hidden', p_hidden));
end $$;
revoke execute on function admin_hide_shop_comment(uuid, boolean) from public, anon;
grant execute on function admin_hide_shop_comment(uuid, boolean) to authenticated;

-- ------------------------------------------------------------------ 4. suspension au signalement
-- Un signalement d'un client connecté (pas le propriétaire) suspend la boutique tout de suite.
-- Garde-fou : au-delà de 5 signalements en 24 h, un même compte ne suspend plus rien (le signalement reste visible par l'admin).
create or replace function suspend_on_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'report' and new.shop_id is not null and new.author_id is not null
     and not exists (select 1 from shops where id = new.shop_id and owner_id = new.author_id)
     and (select count(*) from tickets where author_id = new.author_id and kind = 'report' and created_at > now() - interval '1 day') <= 5 then
    update shops set status = 'suspended', status_reason = 'Signalée par un client : en attente de vérification par NEXORA'
      where id = new.shop_id and status = 'approved';
    if found then
      insert into admin_audit (actor_id, action, target, details)
        values (new.author_id, 'shop_suspended_by_report', new.shop_id::text, jsonb_build_object('ticket', new.id));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists suspend_on_report on tickets;
create trigger suspend_on_report after insert on tickets for each row execute function suspend_on_report();

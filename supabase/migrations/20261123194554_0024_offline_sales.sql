-- Ventes faites hors du site (WhatsApp, téléphone, en boutique) : le vendeur les note en 10 secondes,
-- elles comptent dans son tableau de bord. Et chaque toucher sur « Commander sur WhatsApp » est compté
-- (une « demande WhatsApp »), pour que le vendeur voie ce que NEXORA lui apporte, même hors du site.

create table if not exists manual_sales (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops on delete cascade,
  product_id     uuid references products on delete set null,
  label          text not null check (char_length(label) between 2 and 120),
  qty            int not null default 1 check (qty between 1 and 100000),
  amount         int not null check (amount between 0 and 1000000000),
  channel        text not null default 'whatsapp' check (channel in ('whatsapp', 'telephone', 'boutique', 'autre')),
  customer_name  text check (char_length(customer_name) <= 80),
  customer_phone text check (customer_phone is null or customer_phone ~ '^[+0-9 ]{6,30}$'),
  sold_on        date not null default current_date,
  created_at     timestamptz not null default now()
);
create index if not exists manual_sales_shop_idx on manual_sales (shop_id, sold_on desc);
alter table manual_sales enable row level security;

-- Le vendeur ne voit et ne note que les ventes de SA boutique ; l'admin peut lire (statistiques).
create policy "ventes hors site : le vendeur" on manual_sales for all
  using (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid())
              and (product_id is null or exists (select 1 from products p where p.id = product_id and p.shop_id = manual_sales.shop_id)));
create policy "ventes hors site : lecture admin" on manual_sales for select using (is_admin());

create table if not exists whatsapp_leads (
  id         bigserial primary key,
  shop_id    uuid not null references shops on delete cascade,
  product_id uuid references products on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_leads_shop_idx on whatsapp_leads (shop_id, created_at desc);
alter table whatsapp_leads enable row level security;
create policy "demandes WhatsApp : le vendeur" on whatsapp_leads for select
  using (is_admin() or exists (select 1 from shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- Compté par le serveur seulement (aucune écriture directe), et seulement pour une boutique en ligne.
create or replace function log_whatsapp_lead(p_shop_slug text, p_product_slug text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_shop uuid; v_product uuid;
begin
  select id into v_shop from shops where slug = p_shop_slug and status = 'approved';
  if v_shop is null or not shop_is_live(v_shop) then return; end if;
  if p_product_slug is not null then
    select id into v_product from products where slug = p_product_slug and shop_id = v_shop;
  end if;
  insert into whatsapp_leads (shop_id, product_id) values (v_shop, v_product);
end $$;
revoke execute on function log_whatsapp_lead(text, text) from public, anon, authenticated;

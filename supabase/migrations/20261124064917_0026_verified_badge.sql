-- Badge « Vendeur vérifié » distinct de l'autorisation : l'admin le donne après avoir contrôlé
-- la pièce d'identité (et, s'il y en a un, le registre de commerce). Il peut aussi le retirer.

alter table shops add column if not exists verified_at timestamptz;

create or replace function admin_set_verified(p_shop uuid, p_verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  update shops set verified_at = case when p_verified then now() end where id = p_shop;
  if not found then raise exception 'Boutique introuvable'; end if;
  insert into admin_audit (actor_id, action, target, details)
    values (auth.uid(), 'shop_verified', p_shop::text, jsonb_build_object('verified', p_verified));
end $$;
revoke execute on function admin_set_verified(uuid, boolean) from public, anon;
grant execute on function admin_set_verified(uuid, boolean) to authenticated;

-- Le vendeur ne peut pas se donner le badge lui-même, ni à la création ni après.
create or replace function guard_verified_at() returns trigger
language plpgsql set search_path = public as $$
begin
  if is_end_user() and not is_admin() then
    if tg_op = 'INSERT' then new.verified_at := null;
    elsif new.verified_at is distinct from old.verified_at then raise exception 'Le badge vérifié est attribué par NEXORA';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_verified_at on shops;
create trigger guard_verified_at before insert or update of verified_at on shops for each row execute function guard_verified_at();

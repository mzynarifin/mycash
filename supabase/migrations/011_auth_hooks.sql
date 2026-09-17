-- ============================================================
-- 011_auth_hooks.sql
-- Keep the JWT "user_role" claim synchronized with the trusted
-- user_roles table (role claims refresh on next token refresh).
--
-- Bootstrap of the first admin (server-side only, not exposed
-- through any public flow):
--
--   insert into public.user_roles (user_id, role)
--   values ('<auth_user_uuid>', 'admin');
--
-- The trigger below then writes the claim into auth.users
-- app_metadata so the user's next token refresh carries
-- user_role = admin.
-- ============================================================

create or replace function public.sync_user_role_claim()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := coalesce(new.role, 'user');

  update auth.users
     set raw_app_meta_data = jsonb_set(
           coalesce(raw_app_meta_data, '{}'::jsonb),
           '{user_role}',
           to_jsonb(v_role)
         )
   where id = new.user_id;

  return new;
end;
$$;

create or replace function public.clear_user_role_claim()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update auth.users
     set raw_app_meta_data = jsonb_set(
           coalesce(raw_app_meta_data, '{}'::jsonb),
           '{user_role}',
           to_jsonb('user'::text)
         )
   where id = old.user_id;

  return old;
end;
$$;

drop trigger if exists on_user_role_sync on public.user_roles;
create trigger on_user_role_sync
  after insert or update on public.user_roles
  for each row execute function public.sync_user_role_claim();

drop trigger if exists on_user_role_sync_delete on public.user_roles;
create trigger on_user_role_sync_delete
  after delete on public.user_roles
  for each row execute function public.clear_user_role_claim();
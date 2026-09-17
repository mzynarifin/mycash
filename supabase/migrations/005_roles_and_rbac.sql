-- ============================================================
-- 005_roles_and_rbac.sql
-- Trusted role storage, admin check, profiles email/suspend
-- ============================================================

-- profiles: track user email + suspension state.
-- email is populated on signup so admin lists can show it.
alter table public.profiles
  add column if not exists email text,
  add column if not exists is_suspended boolean not null default false;

-- ── user_roles ─────────────────────────────────────────────
-- Server-managed role table. The source of truth for admin
-- privilege. Public INSERT/UPDATE/DELETE is never allowed:
-- rows are created by the signup trigger and role changes are
-- performed server-side only (service role / SQL editor).
create table public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'user' check (role in ('user', 'admin')),
  updated_at timestamptz not null default now()
);

comment on table public.user_roles is
  'Trusted role storage. Never user-editable via public RLS.';

-- Bootstrap the default 'user' role for new signups and keep
-- profiles.email synchronized with auth.users.
create or replace function public.handle_user_role()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  if new.email is not null and new.email <> '' then
    update public.profiles
       set email = new.email
     where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_role on auth.users;
create trigger on_auth_user_role
  after insert on auth.users
  for each row execute function public.handle_user_role();

-- Trusted admin check used by RLS policies + application code.
-- SECURITY DEFINER: reads user_roles directly, no recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, service_role;

-- ── RLS: user_roles ────────────────────────────────────────
-- Users may read their own role; admins may read all roles.
alter table public.user_roles enable row level security;

create policy "Users can view own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.is_admin());

-- ── RLS: profiles (admin read access) ──────────────────────
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());
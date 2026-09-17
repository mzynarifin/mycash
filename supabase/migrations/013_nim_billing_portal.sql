-- NIM login identity and payment reference for the billing portal.
alter table public.profiles
  add column if not exists nim text;

create unique index if not exists idx_profiles_nim_unique
  on public.profiles (nim)
  where nim is not null;

alter table public.profiles
  add constraint profiles_nim_digits check (nim is null or nim ~ '^[0-9]+$');

alter table public.payments
  add column if not exists reference text;

alter table public.payments
  add constraint payments_reference_length
  check (reference is null or char_length(reference) <= 120);

-- Profile writes from authenticated users may only retain protected values.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if new.nim is distinct from old.nim
       or new.is_suspended is distinct from old.is_suspended
       or new.email is distinct from old.email then
      raise exception 'Protected profile fields cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_identity on public.profiles;
create trigger protect_profile_identity
  before update on public.profiles
  for each row execute function public.protect_profile_identity();

-- The user product is a billing portal; free-form expense writes are disabled.
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;

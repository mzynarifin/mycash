-- ============================================================
-- 001_initial_schema.sql
-- Profiles, categories, expenses tables + updated_at trigger
-- ============================================================

-- profiles
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  avatar_url text,
  currency   text not null default 'IDR',
  theme      text not null default 'system'
               check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table  public.profiles is 'Application-specific user data.';
comment on column public.profiles.id is 'References auth.users.id (1:1).';

-- categories
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  icon       text not null,
  color      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is 'Per-user expense categories.';

-- unique category name per user (case-insensitive)
create unique index idx_categories_user_name_unique
  on public.categories (user_id, lower(name));

-- expenses
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  category_id     uuid not null references public.categories(id) on delete restrict,
  amount          numeric not null check (amount > 0),
  description     text not null,
  expense_date    date not null,
  payment_method  text not null
                    check (payment_method in (
                      'cash', 'bank_transfer', 'e_wallet',
                      'debit_card', 'credit_card', 'other'
                    )),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.expenses is 'Per-user expense records.';

-- updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.expenses
  for each row execute function public.handle_updated_at();

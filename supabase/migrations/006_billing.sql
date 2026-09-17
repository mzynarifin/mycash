-- ============================================================
-- 006_billing.sql
-- Bill definitions + per-user assignments
-- ============================================================

-- ── bills ───────────────────────────────────────────────────
-- Definitions managed exclusively by admins.
create table public.bills (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  reference   text,
  amount      numeric not null check (amount > 0),
  issue_date  date not null default current_date,
  due_date    date not null,
  status      text not null default 'active'
                check (status in ('active', 'cancelled', 'archived')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (due_date >= issue_date)
);

comment on table public.bills is 'Admin-managed bill definitions.';

-- ── bill_assignments ───────────────────────────────────────
-- A user pays toward a bill through its assignment.
create table public.bill_assignments (
  id          uuid primary key default gen_random_uuid(),
  bill_id     uuid not null references public.bills(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (bill_id, user_id)
);

comment on table public.bill_assignments is 'Bills assigned to users.';

create trigger set_updated_at
  before update on public.bills
  for each row execute function public.handle_updated_at();
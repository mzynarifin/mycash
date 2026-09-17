-- ============================================================
-- 007_payments.sql
-- Payment submissions + admin verification
-- ============================================================

create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.bill_assignments(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  amount         numeric not null check (amount > 0),
  payment_method text not null
                   check (payment_method in (
                     'cash', 'bank_transfer', 'e_wallet',
                     'debit_card', 'credit_card', 'qris', 'other'
                   )),
  payment_date   date not null default current_date,
  status         text not null default 'pending'
                   check (status in ('pending', 'verified', 'rejected')),
  reject_reason  text,
  notes          text,
  reviewed_by    uuid references auth.users(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

comment on table public.payments is
  'User payment submissions; verified/rejected by admins.';
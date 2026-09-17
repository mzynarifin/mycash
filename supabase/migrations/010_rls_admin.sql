-- ============================================================
-- 010_rls_admin.sql
-- RLS for bills, assignments, payments, audit logs
-- ============================================================

alter table public.bills            enable row level security;
alter table public.bill_assignments enable row level security;
alter table public.payments         enable row level security;
alter table public.audit_logs       enable row level security;

-- ── bills ──────────────────────────────────────────────────
-- Users may view only bills assigned to their own user ID.
-- Admins get full management access.
create policy "Users can view assigned bills"
  on public.bills for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.bill_assignments ba
      where ba.bill_id = bills.id
        and ba.user_id = auth.uid()
    )
  );

create policy "Admins can insert bills"
  on public.bills for insert
  with check (public.is_admin());

create policy "Admins can update bills"
  on public.bills for update
  using (public.is_admin());

-- No delete policy: bills keep history (cancel/archive instead).

-- ── bill_assignments ───────────────────────────────────────
create policy "Users can view own assignments"
  on public.bill_assignments for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can insert assignments"
  on public.bill_assignments for insert
  with check (public.is_admin());

-- No update/delete policies for public roles.

-- ── payments ───────────────────────────────────────────────
-- Users: SELECT own, INSERT pending payments against their own
-- active assignments only.
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can submit own pending payments"
  on public.payments for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and amount > 0
    and exists (
      select 1
      from public.bill_assignments ba
      join public.bills b on b.id = ba.bill_id
      where ba.id = assignment_id
        and ba.user_id = auth.uid()
        and b.status = 'active'
    )
    and amount <= (
      select b.amount
      from public.bill_assignments ba
      join public.bills b on b.id = ba.bill_id
      where ba.id = assignment_id
        and ba.user_id = auth.uid()
    )
  );

-- Admins: update to verify/reject (conditional update enforced
-- in the server action against status = 'pending').
create policy "Admins can review payments"
  on public.payments for update
  using (public.is_admin());

-- No user update policy: direct status changes are forbidden.
-- No delete policy: payments are preserved.

-- ── audit_logs ─────────────────────────────────────────────
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (public.is_admin());

-- Append-only: no insert/update/delete policies.
-- 017_bill_split.sql
-- Nominal pada tagihan adalah TOTAL. Bagian tiap user = total / jumlah assignment,
-- disimpan di bill_assignments.amount agar perhitungan & RLS konsisten.

alter table public.bill_assignments
  add column if not exists amount numeric;

-- Backfill baris lama: bagian per user = total tagihan / jumlah user yang ditugaskan.
update public.bill_assignments ba
set amount = round(
  (select b.amount from public.bills b where b.id = ba.bill_id) /
  (select count(*)::numeric from public.bill_assignments x where x.bill_id = ba.bill_id)
)
where ba.amount is null;

alter table public.bill_assignments
  add constraint bill_assignments_amount_positive check (amount > 0);

comment on column public.bill_assignments.amount is
  'Bagian per user: total tagihan dibagi jumlah assignment. Diisi oleh recompute_bill_share setelah assignment dibuat.';

-- Hitung ulang bagian per user (dipakai setelah menambah assignment, dari app maupun trigger).
create or replace function public.recompute_bill_share(p_bill_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.bill_assignments ba
  set amount = round(
    (select b.amount from public.bills b where b.id = ba.bill_id) /
    (select count(*)::numeric from public.bill_assignments x where x.bill_id = ba.bill_id)
  )
  where ba.bill_id = p_bill_id;
end;
$$;

-- Broadcast: user baru ikut kebagian; seluruh bagian pada tagihan tersebut diseimbangkan.
create or replace function public.assign_broadcast_bills()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_bill_id uuid;
begin
  insert into public.bill_assignments (bill_id, user_id)
  select b.id, new.id
  from public.bills b
  where b.status = 'active' and b.audience = 'all'
  on conflict (bill_id, user_id) do nothing;

  for v_bill_id in
    select b.id from public.bills b where b.status = 'active' and b.audience = 'all'
  loop
    perform public.recompute_bill_share(v_bill_id);
  end loop;

  return new;
end;
$$;

-- Pembayaran user dibatasi sebesar porsi per-user, bukan total tagihan.
drop policy if exists "Users can submit own pending payments" on public.payments;
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
      select ba.amount
      from public.bill_assignments ba
      where ba.id = assignment_id
        and ba.user_id = auth.uid()
    )
  );
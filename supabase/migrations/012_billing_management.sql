-- Billing Management metadata and stricter admin update policy.
alter table public.bills
  add column if not exists category text not null default 'Lainnya',
  add column if not exists notes text;

alter table public.bills
  add constraint bills_category_length check (char_length(category) between 1 and 60),
  add constraint bills_notes_length check (notes is null or char_length(notes) <= 1000);

drop policy if exists "Admins can update bills" on public.bills;
create policy "Admins can update bills"
  on public.bills for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


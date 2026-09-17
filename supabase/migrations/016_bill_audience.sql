-- 016_bill_audience.sql
-- Tagihan "semua user" (broadcast): user baru otomatis mendapat assignment.

alter table public.bills
  add column if not exists audience text not null default 'selected'
    check (audience in ('selected', 'all'));

comment on column public.bills.audience is
  'selected = hanya user yang ditugaskan; all = semua user aktif, termasuk pendaftar baru.';

-- User baru langsung ditugaskan ke setiap tagihan aktif ber-audience 'all'.
create or replace function public.assign_broadcast_bills()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.bill_assignments (bill_id, user_id)
  select b.id, new.id
  from public.bills b
  where b.status = 'active' and b.audience = 'all'
  on conflict (bill_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_broadcast_bills on auth.users;
create trigger on_auth_user_broadcast_bills
  after insert on auth.users
  for each row execute function public.assign_broadcast_bills();

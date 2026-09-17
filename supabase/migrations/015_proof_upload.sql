-- 015_proof_upload.sql
-- Bukti transfer untuk pembayaran QRIS + bucket penyimpanan.

-- 1) payments: simpan path object bukti.
alter table public.payments
  add column if not exists proof_object text;

-- 2) bucket penyimpanan bukti (public read; write dipagari RLS per folder user).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'bukti-pembayaran', 'bukti-pembayaran', true, 5242880,
       array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
where not exists (select 1 from storage.buckets where id = 'bukti-pembayaran');

-- 3) RLS storage: user hanya mengelola buktinya sendiri (folder `{uid}/...`).
drop policy if exists "Select own proof" on storage.objects;
create policy "Select own proof"
  on storage.objects for select
  using (bucket_id = 'bukti-pembayaran');

drop policy if exists "Insert own proof" on storage.objects;
create policy "Insert own proof"
  on storage.objects for insert
  with check (
    bucket_id = 'bukti-pembayaran'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Update own proof" on storage.objects;
create policy "Update own proof"
  on storage.objects for update
  using (
    bucket_id = 'bukti-pembayaran'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'bukti-pembayaran'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Delete own proof" on storage.objects;
create policy "Delete own proof"
  on storage.objects for delete
  using (
    bucket_id = 'bukti-pembayaran'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- 4) izinkan operasi storage dengan kredensial user biasa.
grant insert, select, update, delete on storage.objects to authenticated;
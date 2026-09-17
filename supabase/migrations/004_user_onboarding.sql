-- ============================================================
-- 004_user_onboarding.sql
-- Trigger: create profile + default categories on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- create profile
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  -- create default categories (Indonesian names matching frontend)
  insert into public.categories (user_id, name, icon, color)
  values
    (new.id, 'Makanan',      'utensils',     '#F59E0B'),
    (new.id, 'Transportasi',  'car',          '#3B82F6'),
    (new.id, 'Tagihan',       'receipt',      '#64748B'),
    (new.id, 'Belanja',       'shopping-bag', '#EC4899'),
    (new.id, 'Hiburan',       'film',         '#8B5CF6'),
    (new.id, 'Kesehatan',     'heart-pulse',  '#10B981'),
    (new.id, 'Pendidikan',    'book-open',    '#06B6D4'),
    (new.id, 'Lainnya',       'package',      '#6B7280');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

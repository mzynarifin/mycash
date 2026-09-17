-- ============================================================
-- 002_indexes.sql
-- Performance indexes for common query patterns
-- ============================================================

-- categories: lookup by user
create index idx_categories_user_id
  on public.categories (user_id);

-- expenses: lookup by user
create index idx_expenses_user_id
  on public.expenses (user_id);

-- expenses: date-range queries
create index idx_expenses_expense_date
  on public.expenses (expense_date);

-- expenses: category filter
create index idx_expenses_category_id
  on public.expenses (category_id);

-- expenses: composite user + date (dashboard date-range + expense list)
create index idx_expenses_user_date
  on public.expenses (user_id, expense_date);

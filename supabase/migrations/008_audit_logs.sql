-- ============================================================
-- 008_audit_logs.sql
-- Append-only audit trail for critical admin operations
-- ============================================================

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only audit trail. No public INSERT/UPDATE/DELETE policies.';
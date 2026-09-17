-- ============================================================
-- 009_indexes.sql
-- Performance indexes for billing, payments, audit, roles
-- ============================================================

-- roles: role lookups (admin checks)
create index idx_user_roles_role
  on public.user_roles (role);

-- bills: list by status + due date, overdue scans
create index idx_bills_status_due
  on public.bills (status, due_date);
create index idx_bills_due_date
  on public.bills (due_date);

-- assignments: bill detail + user bill list
create index idx_assignments_bill
  on public.bill_assignments (bill_id);
create index idx_assignments_user
  on public.bill_assignments (user_id);

-- payments: verification queue, user history, bill progress
create index idx_payments_status_created
  on public.payments (status, created_at);
create index idx_payments_user
  on public.payments (user_id);
create index idx_payments_assignment
  on public.payments (assignment_id);

-- audit logs: chronological + entity lookups
create index idx_audit_logs_created
  on public.audit_logs (created_at);
create index idx_audit_logs_entity
  on public.audit_logs (entity_type, entity_id);
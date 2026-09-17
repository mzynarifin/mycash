# PRD MASTER — MyCash
## Admin Dashboard + User Dashboard + Billing + Payments + Personal Expense Tracking

**Version:** 2.0  
**Status:** Master Product Requirements Document  
**Product:** MyCash  
**Architecture:** Full-stack Next.js + Supabase  
**Frontend:** Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui  
**Design Intelligence:** UI/UX Pro Max  
**Backend:** Next.js Server Components / Server Actions + Supabase  
**Database:** Supabase PostgreSQL  
**Authentication:** Supabase Auth  
**Authorization:** Supabase RLS + RBAC  
**Validation:** Zod  
**Primary Locale:** `id-ID`  
**Primary Currency:** `IDR`  
**Primary Roles:** `admin`, `user`

> This document is the new master PRD and supersedes the previous frontend, backend, and user-dashboard PRDs when requirements conflict.

---

# 1. Product Overview

MyCash adalah aplikasi web untuk mengelola keuangan personal dan tagihan dengan dua area produk yang berbeda:

```text
Admin
└── mengelola akun user
└── membuat dan mengatur tagihan
└── menetapkan tagihan kepada user
└── memonitor pembayaran
└── memverifikasi / menolak pembayaran
└── melihat statistik sistem yang relevan

User
└── melihat dashboard keuangan pribadi
└── melihat tagihan miliknya
└── mencatat pembayaran tagihan
└── mencatat pengeluaran pribadi
└── melihat statistik pengeluaran
└── mengelola kategori pribadi
└── mengelola profil dan preferensi
```

Admin dashboard dan user dashboard adalah dua pengalaman yang berbeda.

Admin tidak boleh diarahkan ke user dashboard sebagai halaman utama.

User tidak boleh memiliki akses ke route admin.

---

# 2. Product Goals

## 2.1 User Goals

User harus dapat:

1. memahami total pengeluaran personal
2. melihat tagihan aktif
3. melihat tagihan yang mendekati jatuh tempo
4. mencatat pembayaran tagihan
5. melihat status verifikasi pembayaran
6. menambahkan pengeluaran pribadi
7. melihat tren pengeluaran
8. melihat kategori pengeluaran terbesar
9. melihat riwayat transaksi
10. mengelola profil dan preferensi

## 2.2 Admin Goals

Admin harus dapat:

1. melihat kondisi sistem secara ringkas
2. membuat akun user
3. melihat daftar akun
4. mengaktifkan / menonaktifkan akun sesuai kebijakan
5. membuat tagihan
6. menetapkan tagihan kepada satu atau banyak user
7. mengubah tagihan yang masih aman untuk diubah
8. membatalkan / mengarsipkan tagihan
9. melihat pembayaran yang dikirim user
10. memverifikasi atau menolak pembayaran
11. melihat tagihan belum dibayar / jatuh tempo
12. melihat audit aktivitas administratif penting

## 2.3 Engineering Goals

- secure by default
- strict role isolation
- database-level authorization
- type-safe
- performant
- accessible
- SEO technically correct
- low client JavaScript where possible
- clean App Router architecture
- no unnecessary backend layers
- easy to maintain

---

# 3. Non-Goals

MyCash bukan:

- payment gateway
- mobile banking
- e-wallet provider
- accounting double-entry system
- ERP
- payroll
- invoicing B2B platform
- investment tracker
- cryptocurrency tracker
- AI financial adviser
- social network
- multi-tenant company accounting platform

Pembayaran pada versi ini berarti:

```text
user mencatat / mengirim informasi pembayaran terhadap tagihan
```

bukan memindahkan uang melalui gateway.

Payment gateway hanya boleh ditambahkan sebagai fase baru jika ada requirement khusus.

---

# 4. Roles

Application roles:

```text
admin
user
```

## User

User hanya mengakses data miliknya sendiri.

## Admin

Admin mengakses fungsi administratif yang diperlukan untuk:

- user management
- bill management
- bill assignments
- payment verification
- system-level operational statistics
- audit logs

Admin tidak otomatis diberi hak untuk membaca detail pengeluaran personal user yang tidak berkaitan dengan tagihan.

Ini adalah batas privasi yang disengaja.

Jika di masa depan admin perlu membaca pengeluaran personal user, tambahkan permission eksplisit melalui requirement baru.

---

# 5. Role-Based Routing

Recommended route structure:

```text
src/app/
├── (auth)/
│   ├── login/
│   ├── forgot-password/
│   └── reset-password/
│
├── (user)/
│   ├── dashboard/
│   ├── bills/
│   ├── payments/
│   ├── expenses/
│   ├── categories/
│   └── settings/
│
└── admin/
    ├── dashboard/
    ├── users/
    ├── users/[id]/
    ├── bills/
    ├── bills/new/
    ├── bills/[id]/
    ├── payments/
    ├── payments/[id]/
    ├── audit-logs/
    └── settings/
```

Routes may be grouped differently if the existing project architecture already has a clear convention.

Do not reorganize working code only to match this tree literally.

---

# 6. Authentication Flow

```text
/login
   ↓
Supabase Auth
   ↓
Authenticated session
   ↓
Resolve application role
   ↓
admin → /admin/dashboard
user  → /dashboard
```

Unauthenticated request to protected routes:

```text
redirect → /login
```

User attempting admin route:

```text
deny
redirect to /dashboard or render 403
```

Admin attempting normal root after login may be routed to:

```text
/admin/dashboard
```

---

# 7. Authentication Requirements

Use Supabase Auth.

Required:

- login
- logout
- session persistence
- forgot password
- reset password
- protected routes
- role-aware redirect

Public self-registration is optional.

If accounts are intended to be created by admin only:

```text
do not expose a public register route
```

or ensure registration is disabled in product UX.

---

# 8. Admin Creates User Accounts

Admin must be able to create a user account from:

```text
/admin/users
```

Primary CTA:

```text
Tambah User
```

Form:

```text
Nama Lengkap
Email
Temporary Password OR Invite Flow
Role (default: user)
Status
```

Default role:

```text
user
```

Admin creation of another admin account should not be exposed casually.

Recommended:

```text
admin UI creates user accounts only
```

Bootstrap / promotion to admin should require a controlled privileged process.

---

# 9. Secure Account Creation

Account creation must happen server-side.

Use the Supabase Admin API.

The admin credential / service role credential must NEVER be exposed to the browser.

Required flow:

```text
Admin submits form
      ↓
Server Action
      ↓
verify authenticated caller
      ↓
verify caller role = admin
      ↓
validate payload
      ↓
server-only Supabase admin client
      ↓
create auth user
      ↓
create / verify profile
      ↓
assign role=user
      ↓
write audit log
      ↓
return safe result
```

Never call:

```text
supabase.auth.admin.createUser
```

from a Client Component.

Never expose privileged credentials through:

```text
NEXT_PUBLIC_*
```

---

# 10. Account Onboarding Strategy

Preferred options:

## Option A — Invite Flow

Admin creates user / sends invite.

User receives email and defines password.

Use if email infrastructure is correctly configured.

## Option B — Temporary Password

Admin creates user with a temporary password.

Profile can contain:

```text
must_change_password = true
```

User is required by application flow to change password after first successful login.

Never store temporary or final password in database tables.

Never display stored passwords because passwords must never be stored by MyCash.

---

# 11. User Account Status

Recommended profile status:

```text
active
suspended
```

Optional:

```text
invited
```

Do not hard-delete accounts as the default admin action.

Prefer:

```text
suspend / disable
```

to preserve bill/payment history.

Permanent account deletion requires a separate confirmation flow and data-retention decision.

---

# 12. RBAC Architecture

Use robust role-based authorization.

Recommended Supabase-aligned approach:

```text
user_roles table
+
Custom Access Token Auth Hook
+
user_role claim
+
RLS policies
```

Roles:

```text
admin
user
```

The role must NOT be stored in user-editable `user_metadata` as the authorization source.

Authorization claims must be controlled by trusted server/database logic.

---

# 13. Role Validation Layers

Authorization must exist in multiple layers:

```text
Route protection
+
Server Action authorization
+
Database RLS
```

Never rely on:

```text
hidden admin sidebar
```

as security.

A user manually navigating to:

```text
/admin/users
```

must still be denied.

---

# 14. UI/UX Pro Max Requirement

Use:

```text
https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
```

OpenCode-compatible design process must be used before major UI changes.

UI/UX Pro Max is used for:

- product design direction
- design system
- typography
- color system
- spacing
- responsive layout
- chart selection
- form ergonomics
- accessibility review
- interaction review
- visual QA

The design system must remain consistent across:

```text
Auth
User Dashboard
Admin Dashboard
User Pages
Admin Pages
```

Admin and user dashboards may differ in information hierarchy but must still belong to the same product family.

---

# 15. Anti AI-Slop — Global Design Rules

Avoid:

- excessive gradients
- glassmorphism
- neon UI
- glowing icons
- giant marketing headings in dashboard
- random background blobs
- excessive shadows
- every section inside a Card
- cards inside cards
- `rounded-3xl` everywhere
- oversized whitespace
- random colored KPI cards
- decorative statistics
- fake percentage trends
- generic SaaS illustrations
- emoji icons
- unnecessary badges
- icon spam
- meaningless animations
- animated number counters for decoration
- fake AI insights
- fake finance recommendations
- unnecessary tabs
- overly stylized tables
- horizontal overflow as a mobile strategy

Use:

- typography hierarchy
- alignment
- spacing
- restrained borders
- semantic color
- consistent density
- real information

---

# 16. Anti AI-Slop — Copywriting

Avoid:

```text
Welcome back!
Take control of your financial journey.
Unlock smarter finance.
Power your financial future.
```

Preferred:

```text
Dashboard
Total Pengeluaran
Tagihan Aktif
Pembayaran Menunggu Verifikasi
Transaksi Terbaru
Tambah Pengeluaran
Catat Pembayaran
Tambah User
Buat Tagihan
```

Product copy should be operational and clear.

---

# 17. Product Navigation — User

User sidebar:

```text
Dashboard
Tagihan
Pembayaran
Pengeluaran
Kategori
Pengaturan
```

Bottom:

```text
User profile
Logout
```

---

# 18. Product Navigation — Admin

Admin sidebar:

```text
Dashboard
User
Tagihan
Pembayaran
Audit Log
Pengaturan
```

Bottom:

```text
Admin profile
Logout
```

Admin UI must clearly indicate administrative context without becoming visually aggressive.

---

# 19. USER DASHBOARD

Route:

```text
/dashboard
```

Purpose:

Give user an immediate understanding of personal finances and assigned bills.

---

# 20. User Dashboard Questions

Dashboard must answer:

1. berapa pengeluaran saya?
2. berapa transaksi saya?
3. apa kategori pengeluaran terbesar?
4. bagaimana tren pengeluaran?
5. berapa tagihan yang masih aktif?
6. apakah ada tagihan mendekati jatuh tempo?
7. pembayaran terakhir saya apa?
8. bagaimana cara menambahkan pengeluaran?
9. bagaimana cara mencatat pembayaran tagihan?

---

# 21. User Dashboard Primary Actions

Provide:

```text
Tambah Pengeluaran
Catat Pembayaran
```

Do not overload header with unrelated actions.

---

# 22. User Dashboard Summary

Recommended metrics:

```text
Total Pengeluaran
Jumlah Transaksi
Tagihan Belum Lunas
Total Tagihan Belum Lunas
```

Secondary information:

```text
Kategori Pengeluaran Terbesar
Tagihan Jatuh Tempo Terdekat
```

Do not add fake growth percentages.

---

# 23. User Dashboard Financial Semantics

MyCash contains two types of user outflow:

```text
1. Pengeluaran pribadi
2. Pembayaran tagihan
```

They must remain separate in the database.

For combined dashboard totals:

```text
Total Outflow =
standalone personal expenses
+
verified bill payments
```

Never automatically create an `expense` row from a bill payment.

This prevents hidden duplication.

UI must clearly distinguish:

```text
Pengeluaran
Pembayaran Tagihan
```

---

# 24. User Dashboard Period Filter

Supported:

```text
Bulan Ini
Bulan Lalu
3 Bulan Terakhir
Tahun Ini
Rentang Kustom
```

Default:

```text
Bulan Ini
```

Period changes should update relevant personal statistics.

---

# 25. User Spending Chart

Show meaningful spending trend.

Recommended:

```text
Line chart
```

Data:

```text
personal expenses + verified bill payments
```

Break down or distinguish source only when it improves comprehension.

Do not stack unnecessary chart layers.

---

# 26. User Category Breakdown

Category breakdown is based on:

```text
personal expenses
```

unless bill categories are explicitly mapped into personal expense categories.

Do not mix unrelated bill classification with user expense categories without a clear mapping.

---

# 27. Upcoming Bills

Dashboard section:

```text
Tagihan Mendatang
```

Show up to:

```text
3–5 bills
```

Each:

```text
Title
Due date
Amount remaining
Status
```

Prioritize nearest due date.

---

# 28. Recent User Activity

Display:

```text
recent personal expenses
recent payment submissions
```

Use clear type labels.

Example:

```text
Makan Siang
Pengeluaran
Rp 35.000

Internet September
Pembayaran Tagihan
Rp 350.000
Menunggu verifikasi
```

---

# 29. USER — Expenses

Route:

```text
/expenses
```

User can:

- create
- read own
- edit own
- delete own
- search
- filter
- sort
- paginate

User cannot access expenses belonging to other users.

---

# 30. Expense Form

Fields:

```text
Jumlah
Deskripsi
Kategori
Tanggal
Metode Pembayaran
Catatan
```

Payment method values:

```text
cash
bank_transfer
e_wallet
debit_card
credit_card
other
```

---

# 31. Expense Validation

Required:

```text
amount > 0
description required
category owned by user
valid expense date
valid payment method
notes optional
```

Client-side validation is UX only.

Server-side validation is mandatory.

---

# 32. USER — Categories

Route:

```text
/categories
```

User can:

- create own categories
- edit own categories
- delete unused categories
- view own categories

If category is referenced by existing expenses:

```text
prevent hard deletion
```

unless a safe reassignment flow exists.

---

# 33. USER — Bills

Route:

```text
/bills
```

User sees only bills assigned to them.

Views:

```text
Semua
Belum Lunas
Jatuh Tempo
Lunas
Dibatalkan
```

Recommended filters:

```text
status
date range
```

---

# 34. Bill User Card / Row

Display:

```text
Judul
Deskripsi ringkas
Jumlah
Sudah Dibayar
Sisa
Jatuh Tempo
Status
```

Primary action when payable:

```text
Catat Pembayaran
```

---

# 35. Bill Status

Recommended user-facing statuses:

```text
Belum Lunas
Sebagian Dibayar
Menunggu Verifikasi
Lunas
Terlambat
Dibatalkan
```

Do not trust a client-provided status.

Status should be derived or changed through controlled backend rules.

---

# 36. USER — Payments

Route:

```text
/payments
```

User sees payment submissions belonging to them.

Filters:

```text
Semua
Menunggu
Terverifikasi
Ditolak
```

User cannot edit a verified payment.

A pending payment may be withdrawable only if product rules explicitly support it.

Core requirement:

```text
do not allow silent editing of verified financial history
```

---

# 37. Record Bill Payment

Primary flow:

```text
Bill
↓
Catat Pembayaran
↓
Amount
Payment date
Payment method
Reference
Notes
↓
Submit
↓
Pending verification
```

Fields:

```text
bill assignment
amount
paid_at
payment_method
reference optional
notes optional
```

Optional future extension:

```text
payment proof upload
```

---

# 38. Payment Validation

Required:

```text
authenticated user
bill assignment belongs to user
bill is payable
amount > 0
amount does not violate remaining-balance rules
valid payment date
valid payment method
```

Do not accept arbitrary:

```text
user_id
bill_id
assignment_id
```

without ownership validation.

---

# 39. Payment Verification Model

Payment submission statuses:

```text
pending
verified
rejected
```

Only admin may transition:

```text
pending → verified
pending → rejected
```

If corrections are required after rejection:

user creates a new submission or uses a specifically defined correction flow.

Do not rewrite verified history silently.

---

# 40. Payment Effect on Bill

Only:

```text
verified payments
```

count toward bill paid amount.

Concept:

```text
paid_amount = SUM(verified payments)
remaining = assigned_amount - paid_amount
```

Derived state:

```text
remaining <= 0 → paid
0 < remaining < amount → partially_paid
remaining = amount → unpaid
```

Overdue:

```text
due_date < today AND remaining > 0
```

Pending submissions may show:

```text
Menunggu Verifikasi
```

but must not be counted as verified paid amount.

---

# 41. ADMIN DASHBOARD

Route:

```text
/admin/dashboard
```

Purpose:

Operational overview.

Admin dashboard is not a copy of the user dashboard.

---

# 42. Admin Dashboard Questions

It must answer:

1. berapa user aktif?
2. berapa tagihan aktif?
3. berapa nilai tagihan yang belum lunas?
4. berapa pembayaran menunggu verifikasi?
5. tagihan mana yang sudah / mendekati jatuh tempo?
6. aktivitas admin penting terakhir apa?
7. apakah ada user / payment requiring attention?

---

# 43. Admin Dashboard Metrics

Recommended:

```text
User Aktif
Tagihan Aktif
Nilai Tagihan Belum Lunas
Pembayaran Menunggu Verifikasi
```

Secondary:

```text
Tagihan Jatuh Tempo
Pembayaran Terverifikasi Bulan Ini
```

No fake percentages.

No invented "system health score".

---

# 44. Admin Dashboard Operational Sections

Recommended:

```text
Summary
↓
Payments Requiring Review
+
Upcoming / Overdue Bills
↓
Recent Admin Activity
```

Charts only if they answer a real operational question.

Potential useful chart:

```text
verified payment value by month
```

Do not add chart just to fill empty space.

---

# 45. ADMIN — User Management

Route:

```text
/admin/users
```

Features:

- user list
- search
- status filter
- pagination
- create user
- open user detail
- suspend user
- reactivate user

Recommended columns:

```text
Nama
Email
Status
Dibuat
Tagihan Aktif
Actions
```

Do not expose passwords.

---

# 46. User Search

Admin can search by:

```text
name
email
```

Search must be server/database-side for scalable datasets.

Do not fetch all users and filter in browser.

---

# 47. Admin User Detail

Route:

```text
/admin/users/[id]
```

Show:

```text
profile
account status
created date
bill assignments
payment history related to bills
```

Do not show personal standalone expense details by default.

Admin actions:

```text
Create bill assignment
Suspend / reactivate
Send password reset or onboarding action
```

---

# 48. Suspend User

Suspension must prevent normal protected app use.

Do not merely set a UI badge.

Enforcement must occur server-side/auth layer.

Existing historical records remain intact.

Write audit log.

---

# 49. Password Administration

Admin must never read a user's password.

For forgotten credentials:

Preferred:

```text
send password reset / recovery flow
```

If temporary-password workflow exists, issue a new temporary credential using a controlled server flow.

Never store passwords in:

```text
profiles
audit_logs
database notes
```

---

# 50. ADMIN — Bills

Route:

```text
/admin/bills
```

Admin can:

- create bill
- assign bill
- search bills
- filter bills
- open bill details
- update safe fields
- cancel bill
- archive bill
- view payment progress

---

# 51. Bill Creation

Route:

```text
/admin/bills/new
```

Fields:

```text
Judul
Deskripsi
Nominal
Tanggal Terbit
Jatuh Tempo
Target User(s)
Optional bill reference
```

Possible assignment modes:

```text
single user
multiple selected users
```

Do not implement complex segmentation unless required.

---

# 52. Bill Data Model

Use separate:

```text
bills
bill_assignments
```

instead of duplicating one entire bill definition per user.

Benefits:

- one bill can target multiple users
- assignment state is per user
- payment state is per assignment
- cleaner audit/history

---

# 53. Bill Editing Rules

Before any verified payment:

Admin may edit allowed bill fields.

After verified payments exist:

Sensitive fields such as:

```text
amount
assigned amount
due relationship
```

must not be silently changed in ways that rewrite financial history.

Preferred:

- restrict editing
- use adjustment flow in future
- cancel / create replacement when necessary

---

# 54. Bill Cancellation

Do not hard-delete bills with assignment/payment history.

Use:

```text
cancelled_at
cancelled_by
```

or status equivalent.

Cancellation must preserve history.

Write audit log.

---

# 55. ADMIN — Payment Verification

Route:

```text
/admin/payments
```

Default focus:

```text
Pending
```

Admin can:

- view pending submissions
- view user
- view bill
- view amount
- view method
- view reference
- view submitted time
- verify
- reject with reason

---

# 56. Verify Payment

Flow:

```text
Admin opens payment
↓
Reviews details
↓
Verify
↓
Server authorization
↓
Transaction / safe update
↓
Payment = verified
↓
Bill assignment recalculated
↓
Audit log
↓
Admin dashboard refresh
↓
User dashboard refresh
```

---

# 57. Reject Payment

Require rejection reason.

Example:

```text
Nominal tidak sesuai.
Referensi pembayaran tidak dapat diverifikasi.
```

Do not use vague rejection by default.

Rejection reason is visible to the relevant user.

---

# 58. Payment Double-Verification Safety

A payment already:

```text
verified
rejected
```

must not be accidentally verified again through stale UI.

Server must check current state before transition.

Prefer atomic update conditions.

---

# 59. Audit Logs

Route:

```text
/admin/audit-logs
```

Record important admin actions:

```text
user.created
user.suspended
user.reactivated
bill.created
bill.updated
bill.cancelled
bill.assigned
payment.verified
payment.rejected
```

Audit record:

```text
id
actor_user_id
action
entity_type
entity_id
safe_metadata
created_at
```

Never store:

- passwords
- tokens
- secret keys
- full sensitive payloads unnecessarily

Audit logs are append-only from application perspective.

---

# 60. Core Database Tables

Required:

```text
profiles
user_roles
categories
expenses
bills
bill_assignments
payments
audit_logs
```

Supabase Auth remains:

```text
auth.users
```

---

# 61. Profiles Table

Suggested:

```text
id uuid PK → auth.users.id
full_name text
avatar_url text nullable
currency text default 'IDR'
theme text default 'system'
account_status text
must_change_password boolean default false
created_at timestamptz
updated_at timestamptz
```

Email remains sourced from Supabase Auth rather than duplicated unnecessarily.

---

# 62. User Roles Table

Suggested:

```text
id bigint identity PK
user_id uuid FK → auth.users.id
role app_role
created_at timestamptz
```

Unique:

```text
(user_id, role)
```

For two-role product, each user should effectively resolve to one application role.

---

# 63. Categories Table

Suggested:

```text
id uuid PK
user_id uuid FK
name text
icon text
color text
created_at timestamptz
updated_at timestamptz
```

User-owned.

---

# 64. Expenses Table

Suggested:

```text
id uuid PK
user_id uuid FK
category_id uuid FK
amount numeric
description text
expense_date date
payment_method text
notes text nullable
created_at timestamptz
updated_at timestamptz
```

Constraint:

```text
amount > 0
```

---

# 65. Bills Table

Suggested:

```text
id uuid PK
created_by uuid FK
title text
description text nullable
default_amount numeric
issue_date date
due_date date
reference text nullable
status text
created_at timestamptz
updated_at timestamptz
cancelled_at timestamptz nullable
cancelled_by uuid nullable
```

Constraint:

```text
default_amount > 0
due_date >= issue_date
```

---

# 66. Bill Assignments Table

Suggested:

```text
id uuid PK
bill_id uuid FK
user_id uuid FK
assigned_amount numeric
created_at timestamptz
updated_at timestamptz
```

Unique:

```text
(bill_id, user_id)
```

Constraint:

```text
assigned_amount > 0
```

Assignment-level status should preferably be derived from:

- bill cancellation
- due date
- verified payment totals

If cached status is stored for performance, it must be updated only through controlled server/database logic.

---

# 67. Payments Table

Suggested:

```text
id uuid PK
bill_assignment_id uuid FK
user_id uuid FK
amount numeric
paid_at date
payment_method text
reference text nullable
notes text nullable
status text
submitted_at timestamptz
reviewed_at timestamptz nullable
reviewed_by uuid nullable
rejection_reason text nullable
created_at timestamptz
updated_at timestamptz
```

Constraint:

```text
amount > 0
```

Statuses:

```text
pending
verified
rejected
```

---

# 68. Audit Logs Table

Suggested:

```text
id uuid PK
actor_user_id uuid
action text
entity_type text
entity_id uuid nullable
metadata jsonb
created_at timestamptz
```

No normal UPDATE / DELETE from application.

---

# 69. Money Storage

Never use floating-point for stored money.

Use:

```text
numeric
```

or a consistent minor-unit integer strategy.

For this PRD:

```text
PostgreSQL numeric
```

is the default.

Frontend format:

```text
Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR"
})
```

---

# 70. Date / Time Strategy

Use:

```text
date
```

for:

- expense date
- issue date
- due date
- paid date

Use:

```text
timestamptz
```

for:

- created_at
- updated_at
- submitted_at
- reviewed_at
- cancelled_at

Do not allow timezone conversion to shift a financial date.

---

# 71. Indexes

Create indexes based on real query patterns.

Recommended:

```text
expenses(user_id, expense_date)
expenses(category_id)

bill_assignments(user_id)
bill_assignments(bill_id)

payments(user_id, submitted_at)
payments(bill_assignment_id)
payments(status, submitted_at)

bills(due_date)
bills(status, due_date)

audit_logs(created_at)
audit_logs(actor_user_id)
```

Do not index every field blindly.

---

# 72. Row Level Security

Enable RLS on every exposed application table.

At minimum:

```text
profiles
user_roles
categories
expenses
bills
bill_assignments
payments
audit_logs
```

RLS is mandatory.

---

# 73. User RLS — Profiles

User:

```text
SELECT own profile
UPDATE allowed own profile fields
```

Admin:

controlled access required for account management.

User must not be able to update:

```text
role
account_status
must_change_password security state
```

through normal profile edit payload.

---

# 74. User RLS — Categories

User:

```text
SELECT own
INSERT own
UPDATE own
DELETE own when allowed
```

Admin does not need unrestricted category access for core requirements.

---

# 75. User RLS — Expenses

User:

```text
SELECT own
INSERT own
UPDATE own
DELETE own
```

Admin:

no default unrestricted SELECT requirement.

---

# 76. User RLS — Bills / Assignments

User:

```text
SELECT bills assigned to own user ID
SELECT own assignments
```

User:

```text
cannot create bills
cannot assign bills
cannot edit bill definitions
```

Admin:

authorized management access.

---

# 77. User RLS — Payments

User:

```text
SELECT own
INSERT against own bill assignments
```

Direct UPDATE of status is forbidden.

User cannot set:

```text
status=verified
reviewed_by
reviewed_at
```

Admin performs verification through privileged authorized operation.

---

# 78. Admin Authorization

Use Supabase RBAC / custom claims strategy.

Recommended claim:

```text
user_role = admin | user
```

Role must be issued from trusted role records via an Auth Hook or equivalent secure mechanism.

Do not rely on user-editable metadata for admin privilege.

---

# 79. JWT Freshness

Role claims may remain stale until token refresh.

Account-role changes must consider session refresh / reauthentication behavior.

Do not assume a role change instantly updates an already-issued JWT.

For highly sensitive server operations, validate admin privilege using a trusted server/database path as appropriate.

---

# 80. Admin Privileged Client

Only create a privileged Supabase admin client in server-only code.

Example conceptual location:

```text
src/lib/supabase/admin.ts
```

Never import it into Client Components.

Never serialize privileged credentials.

Never expose to browser bundles.

---

# 81. Environment Variables

Public:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Server-only privileged credential if required:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

or the current equivalent privileged Supabase server credential used by the project.

Do not prefix privileged secrets with:

```text
NEXT_PUBLIC_
```

Create:

```text
.env.example
```

without real secrets.

---

# 82. Server Actions

Recommended:

```text
auth-actions.ts
expense-actions.ts
category-actions.ts
payment-actions.ts
admin-user-actions.ts
admin-bill-actions.ts
admin-payment-actions.ts
profile-actions.ts
```

Do not make one giant `actions.ts`.

Do not split actions into dozens of meaningless one-line files either.

---

# 83. Server Action Contract

Every mutation:

```text
Authenticate
↓
Authorize role / ownership
↓
Parse payload
↓
Zod validate
↓
Check business rules
↓
Database mutation
↓
Audit if required
↓
Revalidate affected routes
↓
Return safe result
```

---

# 84. Standard Action Result

Recommended pattern:

```ts
type ActionResult<T = undefined> =
    | {
          success: true;
          data?: T;
      }
    | {
          success: false;
          message: string;
          fieldErrors?: Record<string, string[]>;
      };
```

Exact shape may change, but mutation result conventions must be consistent.

---

# 85. Validation Schemas

Required Zod schemas:

```text
loginSchema
forgotPasswordSchema
resetPasswordSchema

expenseSchema
categorySchema
paymentSchema
profileSchema

adminCreateUserSchema
adminUpdateUserStatusSchema
adminCreateBillSchema
adminUpdateBillSchema
adminAssignBillSchema
adminReviewPaymentSchema

dashboardPeriodSchema
paginationSchema
searchFilterSchemas
```

---

# 86. Query Architecture

Recommended:

```text
src/lib/queries/
├── user-dashboard.ts
├── expenses.ts
├── categories.ts
├── bills.ts
├── payments.ts
├── admin-dashboard.ts
├── admin-users.ts
├── admin-bills.ts
└── admin-payments.ts
```

Queries perform reads.

Actions perform mutations.

---

# 87. User Dashboard Data Contract

Conceptual:

```ts
type UserDashboardData = {
    period: {
        from: string;
        to: string;
    };

    summary: {
        totalOutflow: number;
        expenseCount: number;
        unpaidBillCount: number;
        unpaidBillAmount: number;
    };

    spendingTrend: Array<{
        label: string;
        value: number;
    }>;

    categoryBreakdown: Array<{
        categoryId: string;
        categoryName: string;
        total: number;
        percentage: number;
    }>;

    upcomingBills: Array<UpcomingBill>;
    recentActivity: Array<UserActivity>;
};
```

---

# 88. Admin Dashboard Data Contract

Conceptual:

```ts
type AdminDashboardData = {
    activeUsers: number;
    activeBills: number;
    outstandingBillAmount: number;
    pendingPaymentCount: number;
    overdueAssignments: number;

    recentPendingPayments: AdminPaymentListItem[];
    upcomingDueBills: AdminBillOverview[];
    recentAuditEvents: AuditEvent[];
};
```

Do not expose unnecessary personal data in aggregate queries.

---

# 89. Database Aggregations

Do aggregation in:

```text
PostgreSQL
or
server-side query layer
```

not by downloading all rows into the browser.

Examples:

```text
SUM
COUNT
GROUP BY
LIMIT
```

Use RPC/database function only where aggregation becomes significantly cleaner.

Do not create RPC for simple CRUD.

---

# 90. Search / Filter / Sort

Large list pages must use server/database filtering.

User expenses:

```text
search description/notes
category
payment method
date range
sort
pagination
```

Admin users:

```text
name/email
status
pagination
```

Admin bills:

```text
title/reference
due range
status
user assignment where useful
pagination
```

Admin payments:

```text
status
user
date range
bill
pagination
```

---

# 91. URL Search Params

Prefer URL-backed state for list filters.

Example:

```text
/admin/payments?status=pending&page=2
```

Example:

```text
/expenses?q=internet&sort=newest&page=1
```

Validate all params server-side.

Do not accept arbitrary database column names for sorting.

Map allowed UI sort values to fixed query definitions.

---

# 92. Pagination

Do not load unlimited rows.

Initial page size:

```text
20
```

Allow reasonable alternatives if UX requires.

Apply a server-side maximum.

Pagination may be offset-based initially.

Use cursor pagination only when dataset/query needs justify it.

---

# 93. Revalidation

Expense mutation:

```text
/dashboard
/expenses
```

Payment submission:

```text
/dashboard
/bills
/payments
/admin/dashboard
/admin/payments
```

Payment verification:

```text
/admin/dashboard
/admin/payments
/dashboard
/bills
/payments
```

Bill mutation:

```text
/admin/dashboard
/admin/bills
/dashboard or /bills for affected users
```

User administration:

```text
/admin/dashboard
/admin/users
```

Use current Next.js cache/revalidation behavior appropriately.

---

# 94. Error Handling

Expected categories:

```text
validation
authentication
authorization
not found
conflict
business rule violation
database error
external auth error
```

Safe messages.

Never expose:

```text
raw SQL errors
service keys
JWTs
stack traces
internal auth payloads
```

---

# 95. Critical Error Examples

Create user duplicate:

```text
Email tersebut sudah digunakan.
```

Invalid bill payment:

```text
Nominal pembayaran tidak valid.
```

Payment ownership failure:

```text
Tagihan tidak ditemukan atau tidak dapat diakses.
```

Session expired:

```text
Sesi Anda telah berakhir. Silakan login kembali.
```

Category in use:

```text
Kategori masih digunakan oleh pengeluaran dan belum dapat dihapus.
```

---

# 96. Concurrency / Financial Integrity

Payment verification and balance calculation must be safe against stale admin screens.

When verifying:

```text
payment current status must still be pending
```

Use a conditional update or transaction-safe pattern.

Do not allow repeated clicks to double count one payment.

Bill balance is based on:

```text
SUM verified payments
```

not UI state.

---

# 97. Deletion Policy

Hard delete should be limited.

Prefer:

User account:

```text
suspend
```

Bill with history:

```text
cancel/archive
```

Payment:

```text
preserve; verify/reject
```

Audit event:

```text
append-only
```

Expenses:

User may delete own expense if product allows.

---

# 98. Optional Payment Proof Storage

Not mandatory for core v2.

If implemented:

Use Supabase Storage private bucket:

```text
payment-proofs
```

Requirements:

- private
- authenticated access
- ownership policy
- admin read permission
- file size limit
- MIME type allowlist
- no public bucket URLs
- signed access where needed

Never trust file extension alone.

---

# 99. FRONTEND COMPONENT ARCHITECTURE

Recommended feature grouping:

```text
components/
├── layout/
├── dashboard/
├── expenses/
├── bills/
├── payments/
├── admin/
│   ├── dashboard/
│   ├── users/
│   ├── bills/
│   └── payments/
└── ui/
```

Reuse primitives.

Do not make a component for every `<div>`.

---

# 100. User Dashboard Components

Suggested:

```text
user-dashboard-header
period-filter
financial-summary
spending-trend-chart
category-breakdown
upcoming-bills
recent-user-activity
quick-expense-dialog
quick-payment-dialog
```

---

# 101. Admin Dashboard Components

Suggested:

```text
admin-dashboard-header
admin-summary
pending-payment-list
overdue-bill-list
recent-admin-activity
```

Avoid cloning user dashboard cards just with different labels.

---

# 102. Admin User Components

Suggested:

```text
user-table
user-mobile-list
user-filters
create-user-dialog
user-status-dialog
user-detail-summary
```

---

# 103. Bill Components

Suggested:

```text
bill-table
bill-mobile-list
bill-form
bill-assignment-select
bill-detail
bill-status
bill-payment-progress
cancel-bill-dialog
```

---

# 104. Payment Components

Suggested:

```text
payment-table
payment-mobile-list
payment-detail
payment-status
payment-review-dialog
payment-form
```

---

# 105. Responsive Design

Target:

```text
320px
375px
390px
768px
1024px
1280px
1440px+
```

Requirements:

- no horizontal page overflow
- admin tables have mobile alternative
- user tables have mobile alternative
- sheets/forms fit small screens
- chart labels remain readable
- primary action remains reachable
- touch targets usable
- filter controls collapse intelligently

Do not use `overflow-x-auto` as the only responsive strategy.

---

# 106. Mobile Admin UX

Admin tables may transform into:

```text
compact record rows / cards
```

with:

```text
primary identifier
critical metadata
status
actions menu
```

Do not render six tiny desktop columns on 375px screen.

---

# 107. Form UX

All forms:

- persistent labels
- appropriate input types
- inline validation
- pending state
- disabled duplicate-submit
- keyboard support
- error preservation
- focus management after dialog validation error
- visible destructive confirmation

Do not rely on placeholder as label.

---

# 108. Accessibility

Required:

- semantic HTML
- logical heading order
- visible focus
- keyboard navigation
- accessible dialogs
- accessible menus
- form labels
- meaningful button names
- alt text for meaningful images
- reduced-motion consideration
- sufficient contrast
- not color-only status communication

Use current Next.js Core Web Vitals ESLint/accessibility configuration where appropriate.

---

# 109. Charts Accessibility

Charts must have:

- clear title
- readable tooltip
- supporting textual values where necessary
- restrained color palette
- usable dark mode contrast

No:

- 3D chart
- rainbow chart
- unlabeled chart
- chart-only communication for critical status

---

# 110. Icons

Use one icon library consistently:

```text
Lucide React
```

Avoid wildcard importing entire icon sets.

Use icons only where they communicate purpose.

---

# 111. Dark Mode

If existing MyCash supports dark mode:

Admin and user areas must both support it.

Verify:

- charts
- tables
- inputs
- dialogs
- status indicators
- muted text
- borders
- skeletons

Do not implement a separate admin-only theme.

---

# 112. SEO STRATEGY

SEO must distinguish:

```text
public pages
private authenticated application pages
```

Dashboards are private application content and should not be indexed.

---

# 113. Public Page SEO

If MyCash has a public homepage:

```text
/
```

it may be indexed.

Use:

- unique title
- useful description
- canonical
- Open Graph
- Twitter metadata where appropriate
- favicon / icons
- semantic page structure
- crawlable content
- correct language

Do not stuff keywords.

---

# 114. Auth Page SEO

Recommended:

```text
/login
/forgot-password
/reset-password
```

Use:

```text
noindex
```

because authentication pages generally do not need search result exposure.

Do not include private/auth URLs in sitemap.

---

# 115. Private Dashboard SEO

Routes:

```text
/dashboard
/expenses
/categories
/bills
/payments
/settings
/admin/*
```

must use:

```text
noindex
nofollow
```

where appropriate.

Also exclude them from sitemap.

Do not expose user financial data to crawlers through prerendered public HTML.

---

# 116. Next.js Metadata

Use App Router Metadata APIs.

Root:

```text
title template
default title
description
metadataBase
icons
```

Public route may add:

```text
alternates.canonical
openGraph
twitter
```

Private layouts set robots accordingly.

Avoid manually duplicating raw `<head>` tags if Metadata API is appropriate.

---

# 117. robots.ts

Use Next.js file-based metadata:

```text
app/robots.ts
```

Rules should prevent crawling private areas.

Conceptual exclusions:

```text
/dashboard
/expenses
/categories
/bills
/payments
/settings
/admin/
```

Auth routes may also be excluded.

---

# 118. sitemap.ts

Use:

```text
app/sitemap.ts
```

Only public indexable routes belong in sitemap.

Do not include:

- authenticated dashboards
- account pages
- reset URLs
- private finance pages

---

# 119. Structured Data

Only add JSON-LD to public pages when it accurately describes actual public content.

Do not add:

- fabricated ratings
- fake reviews
- fake financial product schema
- irrelevant structured data

Dashboards do not need search structured data.

---

# 120. PERFORMANCE STRATEGY

Performance is a product requirement.

Primary current Core Web Vitals targets at the 75th percentile:

```text
LCP ≤ 2.5s
INP ≤ 200ms
CLS ≤ 0.1
```

Evaluate mobile and desktop.

---

# 121. Server Components First

Default to:

```text
Server Components
```

Use Client Components only for real interaction:

- forms
- dialog/sheet state
- chart rendering
- select/combobox
- local filters when justified
- client-only APIs

Do not put `"use client"` at page/layout root without reason.

---

# 122. Avoid Client Fetch Waterfalls

Do not make every page:

```text
render shell
↓
useEffect
↓
fetch
↓
useEffect
↓
fetch dependent data
```

Prefer server-side parallel data loading.

Independent queries may use:

```text
Promise.all
```

or Suspense boundaries when suitable.

---

# 123. Streaming and Suspense

Use route-level:

```text
loading.tsx
```

and granular Suspense when it improves perceived performance.

Examples:

Dashboard:

```text
summary
charts
recent list
```

may load in appropriately separated boundaries.

Do not create dozens of micro-skeletons that cause visual noise.

---

# 124. Database Performance

Do not fetch entire tables.

Use:

- filtering in DB
- pagination
- aggregation in DB/server
- explicit limits
- relevant indexes
- select only required fields where practical

Avoid N+1 queries.

---

# 125. Charts Performance

Chart libraries are often client-heavy.

Requirements:

- only load charts on pages that need them
- consider dynamic import for non-critical chart modules
- do not duplicate chart libraries
- avoid excessive animation
- do not render hundreds of points unnecessarily

If shadcn chart components / existing chart stack already exist, reuse them.

---

# 126. Images

Use:

```text
next/image
```

for eligible content images.

Provide correct dimensions.

Avoid layout shifts.

Do not add large decorative dashboard imagery.

Avatars should have fixed dimensions.

---

# 127. Fonts

Use:

```text
next/font
```

for product fonts.

Keep font families and weights limited.

Do not load many font families for decorative reasons.

---

# 128. JavaScript Budget Discipline

Avoid:

- unnecessary global state libraries
- giant client-side table libraries unless needed
- multiple date libraries
- multiple icon libraries
- duplicate chart libraries
- dependencies for trivial utilities

Before adding a new package:

```text
check whether existing stack already solves it
```

---

# 129. Route Bundle Review

After implementation:

- inspect route bundle behavior
- identify unexpectedly large Client Components
- split genuinely heavy non-critical modules
- avoid putting admin-only client code in user routes

Admin features should not inflate user dashboard client bundle unnecessarily.

---

# 130. Caching / Freshness

Public shared content can use caching where appropriate.

Personal dashboards are dynamic and user-specific.

Do not cache one user's private data in a way that can be reused for another user.

Use current Next.js data cache/revalidation semantics carefully.

Financial correctness > aggressive caching.

---

# 131. Layout Stability

To protect CLS:

- give charts stable containers
- skeleton dimensions should resemble final content
- define image dimensions
- avoid injecting banners above loaded content
- keep table/list loading structure stable

---

# 132. Interaction Performance

To protect INP:

- keep form handlers small
- avoid expensive synchronous client loops
- debounce search only when actually needed
- move filtering/database work server-side
- avoid rerendering entire dashboards on tiny local state changes

---

# 133. Lighthouse / DevTools QA

Run Lighthouse on relevant public pages and representative authenticated pages.

For public indexable page, targets:

```text
Performance ≥ 90 where environment allows
Accessibility ≥ 90
Best Practices ≥ 90
SEO ≥ 90
```

Do not chase score through hacks that harm real UX.

For authenticated dashboards, Core Web Vitals and practical interaction performance matter more than SEO score.

---

# 134. Performance Regression Rule

Before major UI refactor:

record baseline.

After change:

compare:

- route load
- JS usage
- Lighthouse lab metrics
- obvious layout shifts
- interaction responsiveness

Large regressions require explanation and correction.

---

# 135. Security — Service Credentials

Never expose:

```text
service role
database password
secret key
JWT signing secrets
```

Never:

```text
console.log(secret)
return secret
store secret in client state
commit .env.local
```

---

# 136. Security — Input Trust

Never trust:

```text
user_id
role
payment.status
reviewed_by
bill status
assignment ownership
```

from client payload.

Derive identity and privileged state server-side.

---

# 137. Security — RLS + Grants

RLS policies and Postgres grants must be reviewed together.

Tables exposed through Supabase APIs must not accidentally allow broad `anon` or `authenticated` access.

Use explicit policies.

---

# 138. Security — Views / Functions

If database views or security-definer functions are added:

review RLS implications carefully.

Do not create a view that accidentally bypasses protected row access.

Database functions must:

- set secure search path when appropriate
- use explicit parameters
- avoid dynamic SQL from user input

---

# 139. Security — XSS

User-entered:

```text
notes
descriptions
references
names
```

are plain text.

Do not render with:

```tsx
dangerouslySetInnerHTML
```

unless there is a documented sanitization requirement.

---

# 140. Security — Mutations

Do not perform state-changing actions via GET.

Server Actions / protected POST-style endpoints should verify authenticated context.

Admin destructive actions require confirmation.

---

# 141. Security — Abuse / Limits

Set reasonable:

- text length limits
- pagination max
- file upload limits if enabled
- account creation validation

Do not add Redis solely for rate limiting unless actual deployment risk requires it.

Use platform/Supabase protections where appropriate.

---

# 142. Performance + Privacy Logging

Application logs may contain:

- action name
- entity IDs
- error codes
- timing

Do not log:

- passwords
- auth tokens
- payment secrets
- service keys
- excessive personal finance contents

---

# 143. Empty States

User dashboard:

```text
Belum ada aktivitas keuangan.
Tambahkan pengeluaran atau lihat tagihan Anda untuk mulai.
```

Admin users:

```text
Belum ada user.
Tambah user pertama.
```

Admin payments:

```text
Tidak ada pembayaran yang menunggu verifikasi.
```

Avoid giant decorative illustrations.

---

# 144. Loading States

Use skeletons for:

- dashboard summary
- charts
- user table
- bill table
- payments queue

Do not use full-screen spinner for routine navigation when partial shell can render.

---

# 145. Toast Strategy

Use for completed mutations:

```text
User berhasil dibuat.
Tagihan berhasil dibuat.
Pembayaran berhasil dikirim.
Pembayaran berhasil diverifikasi.
```

Do not toast every navigation or filter change.

---

# 146. Error States

Pages should distinguish:

```text
empty
loading
error
unauthorized
not found
```

Do not show empty state when the actual problem is a failed query.

---

# 147. Admin Destructive Confirmation

Require confirmation for:

```text
Suspend user
Cancel bill
Reject payment
```

For rejection:

reason required.

For permanent deletion if later supported:

strong explicit confirmation.

---

# 148. TypeScript

Use strict TypeScript.

Avoid:

```ts
any
```

Generate Supabase Database types.

Suggested:

```text
src/types/database.ts
```

Domain types may remain separate:

```text
src/types/bill.ts
src/types/payment.ts
src/types/dashboard.ts
```

---

# 149. Migrations

Suggested:

```text
supabase/migrations/
├── 001_types_and_profiles.sql
├── 002_roles_and_rbac.sql
├── 003_expenses_categories.sql
├── 004_billing.sql
├── 005_payments.sql
├── 006_audit_logs.sql
├── 007_indexes.sql
├── 008_rls.sql
└── 009_auth_hooks.sql
```

Exact split may differ.

All database changes should be reproducible.

---

# 150. Seed / Bootstrap

Do not seed fake personal expenses in production.

Allowed:

```text
default user categories
initial admin bootstrap through secure controlled process
development-only test records
```

Initial admin must not be created through an exposed public flow.

---

# 151. Default User Categories

Possible:

```text
Makanan
Transportasi
Tagihan
Belanja
Hiburan
Kesehatan
Pendidikan
Lainnya
```

Created once for new user.

Avoid duplicates.

---

# 152. Audit Critical Operations

Before backend considered complete, verify audit coverage for:

- create user
- suspend/reactivate
- bill create
- bill edit
- bill cancel
- assignments
- payment verify/reject

---

# 153. Testing Strategy

Required test areas:

## Validation

- auth
- expense
- category
- payment
- bill
- admin user creation
- filters
- periods

## Business Logic

- bill remaining balance
- overdue calculation
- verified payment total
- payment state transitions
- role redirect
- dashboard totals

## Security

- cross-user RLS
- user → admin denial
- admin privileged actions
- payment ownership
- bill assignment ownership

---

# 154. Critical RLS Test Matrix

User A:

```text
can read own expenses
cannot read User B expenses
can read own bill assignments
cannot read User B bill assignments
can create payment for own assignment
cannot create payment for User B assignment
cannot verify any payment
cannot access admin management data
```

Admin:

```text
can perform approved admin operations
can manage bills
can manage assignments
can review payments
can create user accounts through server-only path
```

Anonymous:

```text
cannot access private application data
```

---

# 155. Payment Test Cases

```text
amount <= 0 → reject
invalid method → reject
foreign assignment → reject
cancelled bill → reject
overpayment beyond allowed rule → reject
valid own assignment → pending submission
user tries status=verified → ignored/rejected
admin verifies pending → success
admin verifies verified again → reject/no-op safely
admin rejects pending without reason → reject
```

---

# 156. Bill Test Cases

```text
amount <= 0 → reject
due date before issue date → reject
duplicate assignment → reject
user attempts create bill → deny
admin creates bill → success
admin assigns user → success
bill with payment history hard delete → deny
cancelled bill remains in history
```

---

# 157. Admin User Test Cases

```text
user calls admin create action → deny
admin invalid email → reject
admin duplicate email → safe error
admin valid create user → success
role default user
password not persisted in app DB
suspend user → protected access blocked
reactivate user → access restored according to auth policy
```

---

# 158. SEO Test Checklist

Public pages:

- [ ] unique title
- [ ] useful description
- [ ] canonical if needed
- [ ] OG metadata if public/shareable
- [ ] favicon/icons
- [ ] correct `lang`
- [ ] sitemap contains public routes only

Private/auth:

- [ ] no private dashboard in sitemap
- [ ] private areas `noindex`
- [ ] auth routes `noindex`
- [ ] robots does not invite crawling protected routes
- [ ] no private data embedded into public metadata

---

# 159. Performance Test Checklist

- [ ] LCP target ≤ 2.5s at p75
- [ ] INP target ≤ 200ms at p75
- [ ] CLS target ≤ 0.1 at p75
- [ ] no major request waterfalls
- [ ] no large unnecessary client boundaries
- [ ] charts only loaded where needed
- [ ] pagination enabled
- [ ] DB aggregates instead of browser aggregates
- [ ] next/font used
- [ ] next/image used when applicable
- [ ] stable skeleton sizes
- [ ] mobile tested
- [ ] Lighthouse / DevTools reviewed

---

# 160. Anti AI-Slop Review Checklist

- [ ] no excessive gradients
- [ ] no glassmorphism
- [ ] no generic SaaS hero inside dashboard
- [ ] no random icon tiles
- [ ] no fake stats
- [ ] no fake trends
- [ ] no random green/red metrics
- [ ] no unnecessary chart
- [ ] no unnecessary card nesting
- [ ] no giant heading
- [ ] no emoji icons
- [ ] no motivational finance fluff
- [ ] no meaningless badges
- [ ] no decorative activity feed
- [ ] no over-animation
- [ ] no duplicated UI patterns
- [ ] mobile layout designed intentionally
- [ ] backend not overengineered

---

# 161. Code Anti-Slop Review

Avoid:

- one 1000-line dashboard component
- hardcoded mock finance data in production flow
- duplicate Add/Edit forms
- repeated formatters
- repeated role checks with inconsistent rules
- `any`
- unnecessary context providers
- global Redux/Zustand without real need
- heavy client-side fetch architecture
- five architectural layers for a simple query
- arbitrary helper files
- unused abstractions

---

# 162. Recommended Project Structure

Adapt to existing codebase:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (user)/
│   └── admin/
│
├── actions/
│   ├── auth-actions.ts
│   ├── expense-actions.ts
│   ├── category-actions.ts
│   ├── payment-actions.ts
│   ├── admin-user-actions.ts
│   ├── admin-bill-actions.ts
│   └── admin-payment-actions.ts
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── expenses/
│   ├── bills/
│   ├── payments/
│   └── admin/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── queries/
│   ├── validations/
│   ├── auth/
│   └── formatters.ts
│
└── types/
```

Do not force rewrite if current project already has an equivalent clean layout.

---

# 163. Development Sequence

## Phase 0 — Audit

Read:

```text
existing PRDs
current project
package.json
src structure
existing Supabase setup
current dashboard
existing mock data
```

Do not code before understanding existing state.

## Phase 1 — Design System Audit

Use UI/UX Pro Max.

Define or confirm:

- typography
- colors
- spacing
- density
- table treatment
- form treatment
- dashboard information hierarchy
- responsive behavior

## Phase 2 — Auth + Roles

Implement / verify:

- session
- admin/user role
- role redirects
- route protection
- RLS role strategy

## Phase 3 — Database Foundation

Create / migrate:

- profiles
- roles
- categories
- expenses
- bills
- assignments
- payments
- audit logs
- indexes

## Phase 4 — Admin User Management

Implement:

- user list
- create account
- detail
- suspend/reactivate
- audit logging

## Phase 5 — Billing

Implement:

- create bill
- assign users
- list/detail
- cancel/archive
- user bill view

## Phase 6 — Payment Workflow

Implement:

- user payment submission
- admin verification
- rejection
- bill balance
- payment history

## Phase 7 — User Expense Features

Ensure:

- personal expense CRUD
- category CRUD
- search/filter/sort/pagination

## Phase 8 — User Dashboard

Connect:

- personal stats
- bill stats
- chart
- upcoming bills
- recent activity
- quick actions

## Phase 9 — Admin Dashboard

Connect:

- user count
- active bills
- outstanding amount
- pending reviews
- overdue bills
- audit activity

## Phase 10 — SEO

Implement:

- metadata
- noindex boundaries
- robots.ts
- sitemap.ts
- public canonical/OG where applicable

## Phase 11 — Performance

Review:

- server/client boundaries
- DB queries
- Suspense
- charts
- bundles
- fonts
- images
- layout stability

## Phase 12 — Accessibility + Responsive QA

Test:

- keyboard
- screen sizes
- focus
- labels
- dialogs
- mobile admin
- mobile user

## Phase 13 — Security QA

Run:

- role tests
- cross-user tests
- RLS tests
- service credential review
- payment concurrency review

## Phase 14 — Quality Gate

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

No known critical errors.

---

# 164. Definition of Done — Authentication / RBAC

- [ ] login
- [ ] logout
- [ ] forgot/reset password
- [ ] admin redirect
- [ ] user redirect
- [ ] admin route protection
- [ ] user private route protection
- [ ] database-level RLS
- [ ] role claims / trusted role lookup
- [ ] user cannot escalate own role

---

# 165. Definition of Done — Admin

- [ ] admin dashboard
- [ ] user list
- [ ] create user
- [ ] user detail
- [ ] suspend/reactivate
- [ ] bill list
- [ ] create bill
- [ ] assign bill
- [ ] bill detail
- [ ] cancel/archive
- [ ] pending payment queue
- [ ] payment detail
- [ ] verify
- [ ] reject with reason
- [ ] audit log

---

# 166. Definition of Done — User

- [ ] user dashboard
- [ ] personal statistics
- [ ] spending trend
- [ ] categories
- [ ] personal expense CRUD
- [ ] bill list
- [ ] bill detail
- [ ] payment submission
- [ ] payment history
- [ ] payment status
- [ ] settings
- [ ] empty/loading/error states

---

# 167. Definition of Done — Data Integrity

- [ ] no cross-user data leakage
- [ ] no user admin access
- [ ] no user payment self-verification
- [ ] verified payment counted once
- [ ] bill remaining amount correct
- [ ] overdue logic correct
- [ ] cancelled bills preserved
- [ ] audit actions preserved
- [ ] money uses safe numeric storage

---

# 168. Definition of Done — SEO

- [ ] Metadata API used correctly
- [ ] public metadata complete
- [ ] private routes noindex
- [ ] auth routes noindex
- [ ] robots.ts
- [ ] sitemap.ts
- [ ] private routes excluded from sitemap
- [ ] canonical on indexable public routes where applicable
- [ ] no private financial data in metadata

---

# 169. Definition of Done — Performance

- [ ] Server Components default
- [ ] client components minimized
- [ ] no obvious fetch waterfalls
- [ ] pagination
- [ ] database aggregation
- [ ] charts route-scoped
- [ ] next/font
- [ ] next/image when applicable
- [ ] CLS-safe layouts
- [ ] Core Web Vitals reviewed
- [ ] Lighthouse / DevTools reviewed
- [ ] no obvious client bundle bloat

---

# 170. Definition of Done — UI/UX

- [ ] UI/UX Pro Max used
- [ ] admin and user visually consistent
- [ ] admin and user information architecture different where needed
- [ ] responsive mobile/tablet/desktop
- [ ] accessible
- [ ] no AI-slop patterns
- [ ] no fake metrics
- [ ] no unnecessary decoration
- [ ] destructive actions confirmed
- [ ] statuses understandable without color alone

---

# 171. Quality Commands

Before completion:

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

Fix relevant issues before declaring complete.

---

# 172. OpenCode Agent Instruction

Before implementation:

1. Read this master PRD completely.
2. Inspect the current MyCash codebase.
3. Read older PRDs only for additional context.
4. When an older PRD conflicts with this document, follow this master PRD.
5. Inspect current Next.js, React, shadcn/ui, Tailwind, and Supabase versions.
6. Use current official documentation for implementation details.
7. Use UI/UX Pro Max before major visual changes.
8. Do not redesign unrelated working UI.
9. Do not add unnecessary libraries.
10. Do not expose privileged Supabase credentials.
11. Do not bypass RLS.
12. Do not use mock financial statistics in production flows.
13. Implement incrementally.
14. Verify each critical phase before continuing.
15. Preserve security and financial history over convenience.

Before coding, output:

```text
1. Current project condition
2. Existing features already matching this PRD
3. Missing user features
4. Missing admin features
5. Required database migrations
6. Required RBAC/security changes
7. UI changes
8. SEO changes
9. Performance risks
10. Files likely to change/create
11. Implementation order
```

Do not immediately rewrite the entire project.

---

# 173. Documentation Alignment

Implementation should follow current official documentation rather than obsolete snippets.

Primary references:

## Next.js

```text
https://nextjs.org/docs
https://nextjs.org/docs/app
https://nextjs.org/docs/app/getting-started/metadata-and-og-images
https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
```

Use:

- App Router
- Server Components
- Metadata APIs
- file-based metadata
- current cache/revalidation semantics
- current route protection patterns

## Supabase

```text
https://supabase.com/docs/guides/auth
https://supabase.com/docs/reference/javascript/auth-admin-createuser
https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac
```

Use:

- Auth
- server-only Admin API
- RLS
- `auth.uid()`
- trusted RBAC/custom claims
- server-side privileged credentials only

## shadcn/ui

```text
https://ui.shadcn.com/docs
https://ui.shadcn.com/docs/installation/next
```

Use only required components.

Do not install all components blindly.

## UI/UX Pro Max

```text
https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
```

Use for design intelligence and review.

## Web Performance / Core Web Vitals

```text
https://web.dev/articles/vitals
https://web.dev/articles/optimize-inp
```

Current Core Web Vitals:

```text
LCP
INP
CLS
```

Do not use FID as the current interaction Core Web Vital.

---

# 174. Final Product Standard

MyCash must feel like:

```text
a real operational finance application
```

not:

```text
an AI-generated admin template
```

User experience priorities:

```text
clarity
speed
trust
privacy
financial correctness
```

Admin experience priorities:

```text
control
auditability
safe operations
clear queues
efficient management
```

Engineering priorities:

```text
security
data integrity
role isolation
performance
maintainability
accessibility
SEO correctness
```

Every metric must be real.

Every payment must have a clear state.

Every admin action must be authorized.

Every user's private data must remain isolated.

Every private dashboard must remain out of search indexing.

Every visual element must serve a product purpose.

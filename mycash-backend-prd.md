# PRD — MyCash Backend
## Production-Ready Backend for Personal Expense Tracker

**Version:** 1.0  
**Status:** Backend Phase  
**Product:** MyCash / Personal Expense Tracker  
**Frontend:** Existing Next.js frontend from the frontend PRD  
**Backend Stack:** Next.js + Supabase  
**Database:** Supabase PostgreSQL  
**Authentication:** Supabase Auth  
**Validation:** Zod  
**Language:** TypeScript  
**Primary Currency:** IDR  
**Architecture Goal:** Secure, maintainable, typed, production-ready backend without unnecessary complexity

---

# 1. Purpose

Dokumen ini mendefinisikan kebutuhan backend untuk aplikasi **MyCash**, yaitu aplikasi personal expense tracker.

Frontend harus dianggap sudah dibuat terlebih dahulu berdasarkan frontend PRD. Backend pada fase ini bertugas mengganti mock/local data dengan data nyata tanpa merombak UI yang sudah ada.

Backend harus menangani:

- authentication
- authorization
- user profile
- expense persistence
- category persistence
- dashboard aggregation
- search
- filtering
- sorting
- pagination
- settings persistence
- database security
- validation
- error handling

Backend harus sederhana, aman, dan sesuai kebutuhan produk.

Jangan mengubah project menjadi microservices.

Jangan membuat Express.js backend terpisah.

Gunakan kemampuan full-stack Next.js dan Supabase.

---

# 2. Backend Goals

## Primary Goals

1. Menghubungkan frontend MyCash dengan database nyata.
2. Menyediakan autentikasi user yang aman.
3. Memastikan data setiap user terisolasi.
4. Menyediakan CRUD pengeluaran.
5. Menyediakan CRUD kategori.
6. Menyimpan preferensi/profile user.
7. Menyediakan data agregasi dashboard.
8. Mendukung search, filter, sorting, dan pagination.
9. Menjaga seluruh input tervalidasi.
10. Menjaga struktur backend mudah dipahami dan dikembangkan.

## Engineering Goals

- type-safe
- secure by default
- database-driven authorization
- minimal duplication
- predictable error handling
- no unnecessary abstraction
- no unnecessary API layer
- clear server/client boundaries

---

# 3. Non-Goals

Fase ini bukan untuk membuat:

- multi-user household accounting
- company accounting
- bookkeeping double-entry
- invoicing
- payroll
- banking integration
- payment gateway
- investment tracking
- cryptocurrency tracking
- AI financial advisor
- OCR receipt scanning
- bank synchronization
- microservices
- GraphQL
- custom authentication server

Jangan menambahkan fitur tersebut tanpa requirement baru.

---

# 4. Required Stack

Gunakan:

- Next.js latest stable
- App Router
- TypeScript
- Supabase
- Supabase PostgreSQL
- Supabase Auth
- `@supabase/supabase-js`
- `@supabase/ssr`
- Zod

Frontend tetap menggunakan:

- Tailwind CSS
- shadcn/ui

Backend tidak boleh merusak design system frontend.

---

# 5. Architecture

Gunakan arsitektur:

```text
Browser
   │
   ▼
Next.js
   │
   ├── Server Components
   ├── Server Actions
   └── Route Handlers only when necessary
   │
   ▼
Supabase
   │
   ├── Auth
   └── PostgreSQL + RLS
```

Tidak perlu membuat:

```text
Next.js → Express → Supabase
```

Gunakan Next.js langsung sebagai application layer.

---

# 6. Backend Principles

## 6.1 Database Security First

Frontend bukan security boundary.

Jangan hanya menggunakan:

```ts
if (expense.userId === user.id)
```

untuk mengamankan data.

Database harus menggunakan Row Level Security.

## 6.2 Never Trust Client Input

Data dari browser dianggap tidak terpercaya.

Validasi:

- IDs
- amount
- dates
- category
- payment method
- text
- filter values
- sorting values

## 6.3 Server Determines Ownership

Jangan menerima `user_id` dari form sebagai sumber ownership.

Gunakan authenticated Supabase user.

## 6.4 Keep Backend Simple

Jangan membuat repository/service/controller/use-case layers secara berlebihan untuk aplikasi ini.

Abstraction harus memiliki alasan nyata.

---

# 7. Authentication

Gunakan Supabase Auth.

Required flows:

- register
- login
- logout
- session persistence
- protected routes
- authenticated server access

Recommended future-compatible flows:

- forgot password
- reset password

Forgot/reset password boleh dibuat setelah core authentication stabil.

---

# 8. Registration

Fields:

```text
full_name
email
password
confirm_password
```

Validation:

- full name required
- valid email
- password minimum requirement
- confirmation must match password

Flow:

```text
Register form
    ↓
Server validation
    ↓
Supabase Auth sign up
    ↓
User created
    ↓
Profile created
    ↓
Default categories created
    ↓
User enters application
```

Jika email confirmation diaktifkan di Supabase, UX harus menyesuaikan dengan flow tersebut.

Jangan membuat session palsu untuk melewati email confirmation.

---

# 9. Login

Fields:

```text
email
password
```

Flow:

```text
Login form
    ↓
Validate input
    ↓
Supabase signInWithPassword
    ↓
Session established
    ↓
Redirect to /dashboard
```

Gunakan error message yang ramah.

Contoh:

```text
Email atau password tidak sesuai.
```

Jangan tampilkan internal Supabase error mentah kepada user.

---

# 10. Logout

Logout harus:

1. terminate Supabase session
2. clear relevant auth state
3. redirect ke `/login`

Jangan hanya redirect tanpa benar-benar sign out.

---

# 11. Route Protection

Protected routes:

```text
/dashboard
/expenses
/categories
/settings
```

Unauthenticated user:

```text
protected page
    ↓
redirect
    ↓
/login
```

Authenticated user yang membuka:

```text
/login
/register
```

dapat diarahkan ke:

```text
/dashboard
```

Gunakan pola SSR/auth yang sesuai dengan versi Supabase dan Next.js yang digunakan.

---

# 12. Environment Variables

Create:

```text
.env.local
```

Required public values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Buat:

```text
.env.example
```

tanpa secret nyata.

`.env.local` harus masuk `.gitignore`.

Jangan pernah commit credentials.

---

# 13. Secret Management

Never expose:

- database password
- service role key
- private secrets

Jangan memasukkan secret ke variable dengan prefix:

```text
NEXT_PUBLIC_
```

Jika service role key suatu saat benar-benar dibutuhkan, key tersebut hanya boleh digunakan server-side dan hanya untuk operation yang memang memerlukan privileged access.

Core expense CRUD tidak membutuhkan service role.

---

# 14. Database Overview

Core tables:

```text
profiles
categories
expenses
```

Relationship:

```text
auth.users
    │
    ├── 1:1 ── profiles
    │
    ├── 1:N ── categories
    │
    └── 1:N ── expenses

categories
    │
    └── 1:N ── expenses
```

---

# 15. Profiles Table

Purpose:

Menyimpan application-specific user data yang tidak seharusnya disimpan sebagai primary application data di `auth.users`.

Suggested schema:

```sql
profiles
--------
id uuid primary key
full_name text
avatar_url text null
currency text not null default 'IDR'
theme text not null default 'system'
created_at timestamptz not null
updated_at timestamptz not null
```

`id` harus mereferensikan:

```text
auth.users.id
```

Relationship:

```text
auth.users 1 ─── 1 profiles
```

---

# 16. Profile Constraints

Recommended:

```text
currency: non-empty
theme: light | dark | system
```

Default:

```text
currency = IDR
theme = system
```

`full_name` harus memiliki reasonable maximum length.

---

# 17. Categories Table

Schema:

```sql
categories
----------
id uuid primary key
user_id uuid not null
name text not null
icon text not null
color text not null
created_at timestamptz not null
updated_at timestamptz not null
```

Foreign key:

```text
user_id → auth.users.id
```

Setiap category dimiliki satu user.

---

# 18. Default Categories

Saat user baru dibuat, sediakan default categories.

Recommended:

```text
Food
Transportation
Bills
Shopping
Entertainment
Health
Education
Other
```

Gunakan naming yang konsisten dengan frontend.

Jika frontend final menggunakan Bahasa Indonesia, backend seed/default category dapat menggunakan:

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

Jangan membuat duplicate default categories pada setiap login.

Default categories dibuat sekali saat onboarding/account creation.

---

# 19. Category Constraints

Category:

- name required
- trimmed
- reasonable maximum length
- icon required
- color required
- belongs to authenticated user

Prevent duplicate category names per user where appropriate.

Recommended unique constraint:

```text
(user_id, normalized category name)
```

Jika case-insensitive uniqueness sulit dilakukan secara sederhana, validasi server-side + database strategy yang sesuai dapat digunakan.

---

# 20. Expenses Table

Schema:

```sql
expenses
--------
id uuid primary key
user_id uuid not null
category_id uuid not null
amount numeric not null
description text not null
expense_date date not null
payment_method text not null
notes text null
created_at timestamptz not null
updated_at timestamptz not null
```

Foreign keys:

```text
user_id → auth.users.id
category_id → categories.id
```

---

# 21. Money Storage

Jangan menggunakan floating-point database type untuk uang.

Gunakan:

```text
numeric
```

atau strategi integer minor-unit jika project memilihnya secara konsisten.

Untuk MyCash dengan IDR, PostgreSQL `numeric` adalah pilihan yang sederhana dan aman.

Constraint:

```text
amount > 0
```

Frontend display tetap menggunakan formatter IDR.

---

# 22. Payment Method

Supported values:

```text
cash
bank_transfer
e_wallet
debit_card
credit_card
other
```

UI dapat menampilkan label:

```text
Cash
Bank Transfer
E-Wallet
Debit Card
Credit Card
Other
```

Backend menyimpan value yang konsisten.

Gunakan Zod enum atau equivalent validation.

---

# 23. Expense Constraints

Required:

- user_id
- category_id
- amount
- description
- expense_date
- payment_method

Rules:

```text
amount > 0
description trimmed
description not empty
valid date
valid payment method
valid category ownership
notes optional
```

Set reasonable maximum lengths.

---

# 24. Category Ownership Validation

Salah satu risiko penting:

User A tidak boleh membuat expense dengan `category_id` milik User B.

Backend harus memvalidasi category ownership.

Database security juga harus memastikan cross-user relationship tidak dapat disalahgunakan.

Jangan menganggap category valid hanya karena UUID-nya valid.

---

# 25. Timestamp Strategy

Gunakan:

```text
created_at
updated_at
```

dengan timezone-aware timestamp.

Recommended:

```text
timestamptz
```

`created_at` default ke current timestamp.

`updated_at` harus berubah ketika record diperbarui.

Gunakan trigger reusable jika implementasinya tetap sederhana.

---

# 26. Indexes

Tambahkan indexes berdasarkan query nyata.

Recommended expenses indexes:

```text
user_id
expense_date
category_id
(user_id, expense_date)
```

Potential categories index:

```text
user_id
```

Jangan menambahkan index ke setiap column tanpa alasan.

---

# 27. Row Level Security

RLS WAJIB aktif pada:

```text
profiles
categories
expenses
```

Security principle:

```text
auth.uid() = row.user_id
```

atau untuk profile:

```text
auth.uid() = id
```

---

# 28. Profile RLS

User hanya dapat membaca profile sendiri.

Concept:

```sql
auth.uid() = id
```

User hanya dapat mengubah profile sendiri.

User tidak dapat membaca profile private milik user lain.

---

# 29. Category RLS

SELECT:

```text
user_id = auth.uid()
```

INSERT:

new category harus dimiliki:

```text
user_id = auth.uid()
```

UPDATE:

existing row dan resulting row harus tetap milik authenticated user.

DELETE:

hanya category milik authenticated user.

---

# 30. Expense RLS

SELECT:

```text
user_id = auth.uid()
```

INSERT:

```text
user_id = auth.uid()
```

UPDATE:

hanya expense milik authenticated user.

DELETE:

hanya expense milik authenticated user.

RLS adalah lapisan wajib walaupun Server Action sudah melakukan auth check.

---

# 31. Profile Creation

Ketika user register, profile harus tersedia.

Preferred simple approach:

Database trigger after new `auth.users` row.

Trigger membuat:

```text
profiles
```

dan jika dipilih, default categories.

Trigger harus:

- minimal
- deterministic
- idempotency considered
- tidak berisi business logic kompleks

Alternatif boleh digunakan jika lebih sesuai dengan current Supabase guidance, tetapi harus aman terhadap partial onboarding.

---

# 32. Database Migration Structure

Create:

```text
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_indexes.sql
    ├── 003_rls_policies.sql
    └── 004_user_onboarding.sql
```

Jumlah migration dapat disesuaikan.

Yang penting:

- readable
- ordered
- reproducible
- no manual hidden database changes

---

# 33. Database Types

Generate Supabase TypeScript database types.

Suggested location:

```text
src/types/database.ts
```

Gunakan generated types bila memungkinkan.

Domain/UI types tetap boleh dipisahkan jika membantu frontend.

Jangan menggunakan `any` untuk database rows.

---

# 34. Supabase Client Architecture

Suggested:

```text
src/lib/supabase/
├── client.ts
├── server.ts
└── middleware.ts
```

Purpose:

### client.ts

Browser/client-side Supabase client hanya ketika benar-benar diperlukan.

### server.ts

Server-side Supabase client untuk Server Components dan Server Actions.

### middleware/proxy equivalent

Handle session refresh/protection mengikuti current Next.js + Supabase recommended pattern.

Gunakan current official API pattern pada saat implementasi.

Jangan menggunakan deprecated Supabase auth helpers.

---

# 35. Server-First Data Access

Prefer:

```text
Server Component → Supabase
```

untuk initial page data.

Client Components digunakan untuk interaction.

Jangan membuat:

```text
Client Component
    ↓
useEffect
    ↓
fetch everything
```

untuk seluruh halaman jika server rendering dapat digunakan.

---

# 36. Mutations

Use Server Actions where appropriate.

Required actions:

```text
createExpense
updateExpense
deleteExpense

createCategory
updateCategory
deleteCategory

updateProfile
```

Auth actions:

```text
login
register
logout
```

Names boleh disesuaikan dengan architecture project.

---

# 37. Server Action Contract

Setiap mutation harus mengikuti flow:

```text
Request
    ↓
Authenticate
    ↓
Parse input
    ↓
Validate using Zod
    ↓
Check ownership/business constraints
    ↓
Database operation
    ↓
Handle database error
    ↓
Revalidate affected UI
    ↓
Return safe result
```

Jangan melakukan database mutation sebelum auth dan validation selesai.

---

# 38. Action Result

Gunakan response shape yang konsisten.

Example:

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

Tidak wajib menggunakan bentuk persis ini.

Yang wajib adalah konsistensi.

---

# 39. Expense Validation Schema

Create Zod schema.

Concept:

```ts
amount
description
categoryId
expenseDate
paymentMethod
notes
```

Validate:

```text
amount > 0
description required
category UUID valid
date valid
payment method allowed
notes optional
```

Server validation adalah mandatory.

Client validation hanya UX layer.

---

# 40. Category Validation Schema

Fields:

```text
name
icon
color
```

Validate:

- required
- trimmed
- max lengths
- expected color representation
- safe icon identifier

Jangan menerima arbitrary executable content sebagai icon.

---

# 41. Profile Validation

Fields:

```text
fullName
currency
theme
```

Validate allowed currency/theme.

Untuk versi awal, currency dapat hanya:

```text
IDR
```

atau disiapkan sebagai enum jika frontend memang menawarkan pilihan lain.

---

# 42. Create Expense

Flow:

```text
Expense form
    ↓
createExpense
    ↓
get authenticated user
    ↓
validate payload
    ↓
verify category belongs to user
    ↓
insert expense using authenticated user ID
    ↓
revalidate dashboard + expenses
    ↓
return success
```

Never accept ownership from:

```text
formData.user_id
```

---

# 43. Read Expenses

Expenses page harus membaca hanya data authenticated user.

Query needs:

- pagination
- search
- category filter
- payment method filter
- date filter
- sorting

Jangan fetch semua expense lalu filter di browser.

---

# 44. Search

Search fields:

```text
description
notes
```

Search harus dilakukan database-side.

Sanitize/validate search input.

Gunakan parameterized Supabase query builder.

Jangan membangun raw SQL dari user input.

---

# 45. Expense Filters

Supported filters:

```text
category
payment method
date from
date to
```

Optional:

```text
minimum amount
maximum amount
```

Only implement amount range if frontend uses it.

Empty filter harus dianggap "all".

---

# 46. Sorting

Allowed values:

```text
newest
oldest
highest_amount
lowest_amount
```

Map user-facing sort option ke predefined database ordering.

Jangan menerima arbitrary database column/order string dari client.

---

# 47. Pagination

Pagination required.

Untuk versi awal, offset/page-based pagination cukup.

Example:

```text
page = 1
pageSize = 20
```

Validate limits.

Recommended maximum page size:

```text
100
```

Jangan izinkan client meminta unlimited rows.

Cursor pagination dapat digunakan jika ada alasan nyata, tetapi tidak wajib.

---

# 48. Expense Detail Fetch

Jika UI membutuhkan expense individual untuk edit:

Fetch berdasarkan:

```text
expense id
authenticated user
```

RLS tetap aktif.

Jika tidak ditemukan, return safe not-found result.

Jangan membedakan secara sensitif antara:

```text
record tidak ada
```

dan:

```text
record milik user lain
```

kepada client.

---

# 49. Update Expense

Flow:

```text
authenticate
validate expense ID
validate payload
verify category ownership
update matching expense
revalidate
return result
```

RLS harus mencegah update record milik user lain.

---

# 50. Delete Expense

Flow:

```text
authenticate
validate ID
delete
revalidate
return success
```

Delete confirmation tetap dilakukan di frontend.

Backend tidak boleh mempercayai confirmation flag sebagai security mechanism.

---

# 51. Categories Read

Categories query:

- authenticated user only
- stable ordering

Recommended ordering:

```text
name ascending
```

atau custom created ordering jika frontend membutuhkan.

---

# 52. Create Category

Flow:

```text
authenticate
validate
normalize name
check duplicate
insert using authenticated user ID
revalidate categories
return
```

Handle duplicate category gracefully.

---

# 53. Update Category

User hanya dapat mengubah category sendiri.

Validate:

- ID
- name
- icon
- color

Check duplicate category name where applicable.

---

# 54. Delete Category

Category deletion harus aman jika category digunakan expense.

Preferred Phase 1 strategy:

```text
Prevent deletion when referenced by expenses.
```

Return:

```text
Kategori tidak dapat dihapus karena masih digunakan oleh pengeluaran.
```

Ini lebih aman daripada silently deleting related expenses.

Jangan cascade-delete expenses ketika category dihapus.

---

# 55. Foreign Key Delete Behavior

Recommended:

```text
categories → expenses
ON DELETE RESTRICT
```

atau equivalent behavior.

User account deletion behavior dapat dirancang agar owned application data terhapus melalui controlled cascade where appropriate.

Jangan memilih cascade tanpa memahami akibatnya.

---

# 56. Dashboard Backend Requirements

Dashboard membutuhkan real aggregation.

Required metrics:

```text
total spending
transaction count
average expense
top category
spending trend
category breakdown
recent expenses
```

Semua berdasarkan authenticated user.

---

# 57. Dashboard Period

Supported:

```text
this_month
last_month
last_3_months
this_year
custom
```

Create shared date-range logic.

Jangan menduplikasi perhitungan date range di banyak file.

---

# 58. Total Spending

Concept:

```sql
SUM(amount)
```

Filtered by:

```text
authenticated user
selected date range
```

Jika tidak ada expense:

```text
0
```

bukan error.

---

# 59. Transaction Count

Concept:

```sql
COUNT(*)
```

berdasarkan user dan selected period.

---

# 60. Average Expense

Concept:

```text
total spending / transaction count
```

Jika transaction count = 0:

```text
average = 0
```

Hindari divide-by-zero.

---

# 61. Top Category

Calculate category dengan spending terbesar pada selected period.

Return safe structure:

```ts
{
    categoryId,
    categoryName,
    total
}
```

Jika tidak ada expense:

```text
null
```

atau explicit empty representation.

---

# 62. Category Breakdown

Aggregate:

```text
category
total spending
percentage
```

Percentage dapat dihitung server-side/application layer berdasarkan aggregate totals.

Pastikan hasil konsisten.

---

# 63. Spending Trend

Group spending berdasarkan period yang masuk akal.

Example:

For month:

```text
daily
```

For last 3 months/year:

```text
monthly
```

Jangan return setiap transaction ke client hanya untuk membuat aggregation chart.

---

# 64. Recent Expenses

Dashboard menampilkan limited recent expenses.

Recommended:

```text
5–10 records
```

Sorted:

```text
expense_date DESC
created_at DESC
```

---

# 65. Aggregation Implementation

Untuk initial version, pilih solusi paling sederhana yang performant.

Possible approaches:

1. Supabase/PostgREST queries
2. PostgreSQL RPC/function for complex aggregation

Jangan membuat RPC untuk CRUD sederhana.

RPC dapat digunakan untuk dashboard aggregation jika menghasilkan query yang lebih bersih dan efisien.

Jika menggunakan PostgreSQL function:

- scope by `auth.uid()`
- validate parameters
- avoid unsafe dynamic SQL
- keep RLS/security implications clear

---

# 66. Profile Settings

Settings persistence:

```text
full_name
currency
theme
```

Email berasal dari Supabase Auth.

Jangan menyimpan password di profiles.

Jangan pernah menyimpan plain-text password.

---

# 67. Email Change

Tidak wajib pada core backend phase.

Jika ditambahkan kemudian, gunakan Supabase Auth email update flow.

Jangan langsung mengubah email hanya di `profiles`.

---

# 68. Password Change

Tidak wajib untuk core backend phase.

Jika ditambahkan, gunakan Supabase Auth API.

Jangan menyimpan hash/password sendiri.

---

# 69. Avatar

`avatar_url` dapat disiapkan dalam schema.

Upload avatar dengan Supabase Storage bukan requirement wajib fase backend core.

Jika belum digunakan frontend, jangan implementasikan Storage hanya karena field tersedia.

---

# 70. Error Handling

Backend errors harus dibagi menjadi:

```text
validation error
authentication error
authorization/not-found
conflict
database/internal error
```

User-facing messages harus aman.

Contoh:

Validation:

```text
Jumlah pengeluaran harus lebih dari 0.
```

Auth:

```text
Sesi Anda telah berakhir. Silakan login kembali.
```

Conflict:

```text
Kategori dengan nama tersebut sudah ada.
```

Internal:

```text
Terjadi kesalahan saat menyimpan data. Silakan coba lagi.
```

---

# 71. Error Logging

Internal error boleh dicatat server-side.

Jangan log:

- passwords
- access tokens
- refresh tokens
- service keys
- sensitive credentials

Hindari logging full request payload jika dapat mengandung sensitive data.

---

# 72. Database Error Mapping

Jangan return raw PostgreSQL error ke browser.

Map expected errors.

Examples:

```text
unique violation → duplicate category
foreign key violation → invalid category / category in use
auth failure → login message
```

Unexpected errors menjadi generic safe message.

---

# 73. Input Normalization

Before validation/storage where appropriate:

```text
trim description
trim notes
trim category name
normalize enum values
```

Jangan mengubah user text secara agresif.

---

# 74. Security Requirements

Mandatory:

- RLS enabled
- authenticated ownership
- server validation
- no exposed service role
- no raw SQL concatenation
- no trusting user_id
- protected routes
- safe error messages
- secrets in environment variables
- limited query sizes
- validated sorting/filtering

---

# 75. SQL Injection

Prefer Supabase query builder.

Jika SQL function digunakan:

- use parameters
- avoid dynamic SQL
- never concatenate untrusted user input into SQL statements

---

# 76. XSS Considerations

React escaping tetap digunakan.

Description/notes harus dianggap plain text.

Jangan render user-provided notes menggunakan:

```tsx
dangerouslySetInnerHTML
```

tanpa kebutuhan dan sanitization yang benar.

---

# 77. CSRF / Mutation Safety

Gunakan Next.js/Supabase recommended authenticated server patterns.

Mutation harus bergantung pada authenticated session dan server-side ownership.

Jangan membuat public mutation endpoint tanpa auth.

---

# 78. Rate / Abuse Considerations

Tidak perlu membangun custom rate-limiter kompleks untuk MVP.

Namun:

- authentication endpoint mengikuti Supabase protections
- mutation inputs dibatasi
- pagination dibatasi
- text lengths dibatasi

Jika aplikasi menjadi public/high-traffic, rate limiting dapat ditambahkan kemudian.

---

# 79. Data Access Structure

Recommended:

```text
src/
├── actions/
│   ├── auth-actions.ts
│   ├── expense-actions.ts
│   ├── category-actions.ts
│   └── profile-actions.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   │
│   ├── queries/
│   │   ├── expenses.ts
│   │   ├── categories.ts
│   │   ├── dashboard.ts
│   │   └── profile.ts
│   │
│   └── validations/
│       ├── auth.ts
│       ├── expense.ts
│       ├── category.ts
│       └── profile.ts
│
└── types/
    └── database.ts
```

Adapt to existing frontend structure.

Jangan merombak folder frontend hanya untuk mengikuti contoh ini secara literal.

---

# 80. Queries vs Actions

Use queries for reads.

Examples:

```text
getExpenses
getCategories
getDashboardSummary
getProfile
```

Use actions for mutations.

Examples:

```text
createExpense
updateExpense
deleteExpense
```

Jangan mencampur mutation dan query logic tanpa alasan.

---

# 81. No Unnecessary REST API

Untuk frontend Next.js yang sama, jangan otomatis membuat:

```text
/api/expenses
/api/categories
/api/dashboard
```

jika Server Components + Server Actions sudah memenuhi kebutuhan.

Route Handlers digunakan jika ada kebutuhan HTTP endpoint nyata seperti:

- external webhook
- external client
- callback
- download endpoint

---

# 82. Frontend Integration

Replace frontend mock data incrementally.

Recommended sequence:

```text
Mock categories
    ↓
Real categories

Mock expenses
    ↓
Real expenses

Mock dashboard
    ↓
Real aggregation

Mock settings
    ↓
Real profile
```

Jangan mengganti seluruh frontend dalam satu perubahan besar jika dapat dilakukan bertahap.

---

# 83. Preserve UI Contracts

Existing components sebaiknya menerima domain data.

Example:

```tsx
<ExpenseTable expenses={expenses} />
```

Backend integration harus menyesuaikan data ke contract UI.

Jangan membuat UI component bergantung langsung pada Supabase response object jika tidak perlu.

---

# 84. Loading Integration

Gunakan existing frontend:

- skeleton
- loading states
- submit loading state

Server mutation harus menyediakan state yang memungkinkan:

```text
pending
success
error
```

Jangan menghapus loading UX yang sudah dibuat pada frontend phase.

---

# 85. Empty States

Backend query dengan zero rows bukan error.

Return empty collection:

```ts
[]
```

Frontend menampilkan existing empty state.

Dashboard aggregate kosong menggunakan zero/null sesuai contract.

---

# 86. Search Params

Expense filters dapat direpresentasikan di URL.

Example concept:

```text
/expenses?page=2&category=...&sort=newest&q=kopi
```

Benefits:

- refresh-safe
- shareable state
- server-side queries
- browser navigation

Gunakan hanya filter yang valid.

---

# 87. Query Input Schema

Create validation for search params.

Example domain:

```ts
{
    page,
    pageSize,
    query,
    categoryId,
    paymentMethod,
    dateFrom,
    dateTo,
    sort
}
```

Apply defaults server-side.

---

# 88. Date Handling

Database:

```text
expense_date = date
created_at = timestamptz
updated_at = timestamptz
```

Expense date merepresentasikan tanggal transaksi, bukan timestamp event server.

Be careful with timezone conversion.

Jangan mengubah `2026-09-16` menjadi tanggal lain karena timezone conversion.

---

# 89. Locale

Primary UI locale:

```text
id-ID
```

Primary currency:

```text
IDR
```

Database menyimpan raw values.

Formatting dilakukan presentation layer.

---

# 90. Performance

Avoid:

- loading all expenses
- N+1 category queries
- repeated profile queries
- multiple identical dashboard queries where avoidable

Use joins/relations appropriately.

Select hanya columns yang diperlukan jika practical.

---

# 91. Caching and Revalidation

Gunakan Next.js caching/revalidation sesuai kebutuhan dan versi framework.

Setelah create/update/delete expense:

revalidate affected views:

```text
/dashboard
/expenses
```

Setelah category mutation:

```text
/categories
/expenses
/dashboard
```

jika relevant.

Setelah profile mutation:

```text
/settings
layout/header
```

Avoid stale financial data after mutation.

---

# 92. Optimistic UI

Optional.

Gunakan hanya jika frontend already benefits from it.

Financial data correctness lebih penting daripada flashy optimistic behavior.

Jika optimistic update dibuat:

- rollback on error
- server remains source of truth

---

# 93. Testing Strategy

Minimum backend tests should cover important pure logic and validation.

Test:

- expense schema
- category schema
- profile schema
- auth schema
- query param validation
- date range logic
- sorting mapping
- currency/domain conversion if applicable

Database/RLS tests sangat dianjurkan.

---

# 94. RLS Test Cases

Verify conceptually or automatically:

### User A

Can:

```text
read own expenses
create own expenses
update own expenses
delete own expenses
manage own categories
read/update own profile
```

Cannot:

```text
read User B expenses
update User B expenses
delete User B expenses
read User B private profile
manage User B categories
```

### Anonymous

Cannot:

```text
read expenses
create expenses
update expenses
delete expenses
read private profiles
manage categories
```

Do not declare security complete without checking cross-user access.

---

# 95. Expense Test Cases

Test:

```text
amount = 0 → rejected
amount < 0 → rejected
invalid category → rejected
foreign category → rejected
empty description → rejected
invalid payment method → rejected
valid expense → accepted
```

---

# 96. Category Test Cases

Test:

```text
empty name → rejected
duplicate own category → rejected
update own category → allowed
update other user's category → blocked
delete used category → blocked
delete unused own category → allowed
```

---

# 97. Authentication Test Cases

Test:

```text
valid register
invalid email
weak/invalid password
password confirmation mismatch
valid login
invalid credentials
logout
protected page without session
protected page with session
```

---

# 98. Seed Data

Production users should not receive fake transactions.

Allowed:

- default categories
- development-only test data

Keep development seed separate from production migrations where appropriate.

Never automatically insert fake expenses into a real user's account.

---

# 99. Local Development

Document:

1. create Supabase project or local Supabase environment
2. configure env
3. run migrations
4. generate types
5. run Next.js

Commands must match the actual tooling installed in the project.

Do not document commands that were not verified.

---

# 100. README Update

Update README with backend section.

Include:

- backend architecture
- Supabase setup
- environment variables
- migrations
- auth setup
- type generation
- local development
- database schema summary
- RLS explanation
- production considerations

Never put actual secret values in README.

---

# 101. Production Checklist

Before production:

- [ ] environment variables configured
- [ ] migrations applied
- [ ] RLS enabled
- [ ] policies verified
- [ ] auth redirect URLs configured
- [ ] no service key exposed
- [ ] no `.env.local` committed
- [ ] no raw internal errors exposed
- [ ] cross-user security tested
- [ ] production build passes

---

# 102. Lint

Run:

```bash
npm run lint
```

Fix relevant errors before completion.

---

# 103. Type Check

Run:

```bash
npx tsc --noEmit
```

No TypeScript errors allowed for completed backend integration.

---

# 104. Production Build

Run:

```bash
npm run build
```

Backend phase is not complete if production build fails.

---

# 105. Implementation Order

Implement in this order.

## Phase 1 — Audit

Inspect:

- frontend PRD
- existing frontend
- package.json
- routes
- domain types
- forms
- mock data
- component contracts

Do not code before understanding the existing frontend.

## Phase 2 — Supabase Foundation

- install required Supabase packages
- environment variables
- client/server helpers
- session handling

## Phase 3 — Database

- profiles
- categories
- expenses
- constraints
- indexes
- timestamps

## Phase 4 — Security

- enable RLS
- policies
- ownership rules
- test cross-user access

## Phase 5 — Authentication

- register
- login
- logout
- protected routes
- profile onboarding
- default categories

## Phase 6 — Categories

Replace mock category data with database data.

Implement:

- read
- create
- update
- delete

## Phase 7 — Expenses

Replace mock expense data.

Implement:

- read
- create
- update
- delete
- pagination

## Phase 8 — Expense Query Features

Implement:

- search
- filters
- sorting
- URL search params

## Phase 9 — Dashboard

Replace dashboard mock data with real:

- total
- count
- average
- top category
- category breakdown
- trend
- recent expenses

## Phase 10 — Settings

Persist:

- full name
- currency
- theme where appropriate

## Phase 11 — Error/Loading Integration

Ensure existing frontend states work with real backend.

## Phase 12 — Testing & Security Review

Test:

- validation
- RLS
- cross-user access
- auth
- CRUD
- category references

## Phase 13 — Quality

Run:

```text
lint
typecheck
build
```

---

# 106. Do Not Break the Frontend

Backend implementation must preserve:

- visual design
- responsive behavior
- shadcn components
- frontend design system
- component UX
- dialogs
- empty states
- loading states
- error states

Only modify frontend code when needed for real backend integration.

Do not redesign the application during backend implementation.

---

# 107. Avoid Overengineering

Do NOT automatically add:

- Prisma
- Drizzle
- Express
- NestJS
- GraphQL
- tRPC
- Redis
- Docker
- message queues
- event bus
- CQRS
- repository pattern
- dependency injection framework
- custom auth
- ORM

Supabase PostgreSQL + Supabase client + Next.js are sufficient unless a real requirement proves otherwise.

---

# 108. Backend Definition of Done

Backend is complete when:

## Supabase

- [ ] Supabase configured
- [ ] environment variables documented
- [ ] server/client setup correct

## Database

- [ ] profiles table
- [ ] categories table
- [ ] expenses table
- [ ] foreign keys
- [ ] constraints
- [ ] indexes
- [ ] timestamps
- [ ] migrations

## Security

- [ ] RLS enabled
- [ ] profile policies
- [ ] category policies
- [ ] expense policies
- [ ] cross-user access blocked
- [ ] anonymous private access blocked
- [ ] secrets protected

## Authentication

- [ ] register
- [ ] login
- [ ] logout
- [ ] session persistence
- [ ] protected routes
- [ ] profile onboarding
- [ ] default categories

## Expenses

- [ ] real read
- [ ] create
- [ ] update
- [ ] delete
- [ ] search
- [ ] filters
- [ ] sorting
- [ ] pagination

## Categories

- [ ] real read
- [ ] create
- [ ] update
- [ ] safe delete
- [ ] duplicate handling

## Dashboard

- [ ] total spending
- [ ] transaction count
- [ ] average expense
- [ ] top category
- [ ] spending trend
- [ ] category breakdown
- [ ] recent expenses
- [ ] period filters use real data

## Settings

- [ ] profile persistence
- [ ] currency persistence
- [ ] supported preference persistence

## UX Integration

- [ ] loading states work
- [ ] empty states work
- [ ] errors are user-friendly
- [ ] mutations show feedback
- [ ] no mock financial data remains in production flow

## Quality

- [ ] validation schemas
- [ ] lint passes
- [ ] typecheck passes
- [ ] build passes
- [ ] README updated

---

# 109. Security Acceptance Criteria

The following scenario MUST fail:

```text
User A obtains an expense UUID belonging to User B
    ↓
User A tries SELECT / UPDATE / DELETE
    ↓
Database denies access
```

The following MUST also fail:

```text
User A obtains User B category UUID
    ↓
User A attempts to use it for a new expense
    ↓
Operation rejected
```

Security cannot depend on hidden buttons or frontend filtering.

---

# 110. Data Integrity Acceptance Criteria

Database must prevent or backend must safely reject:

```text
negative expense
zero expense
missing description
invalid category
foreign category
invalid payment method
invalid user ownership
duplicate category where uniqueness is enforced
deleting category still in use
```

---

# 111. Backend Completion Report

When implementation is complete, report:

```text
1. Supabase configuration completed
2. Database tables created
3. Migrations created
4. RLS policies implemented
5. Authentication implemented
6. Categories connected
7. Expenses connected
8. Dashboard connected
9. Settings connected
10. Tests/security checks performed
11. Lint result
12. Typecheck result
13. Build result
14. Remaining limitations
```

Do not claim something is completed unless it was actually implemented and verified.

---

# 112. Important Agent Instructions

Before writing backend code:

1. Read this backend PRD completely.
2. Read the frontend PRD completely.
3. Inspect the current project.
4. Identify existing mock data and component contracts.
5. Create an implementation plan.
6. Do not redesign the frontend.
7. Do not add unnecessary technologies.
8. Do not bypass RLS.
9. Do not expose secrets.
10. Do not implement all backend features blindly in one uncontrolled step.

Implement incrementally.

After every major phase:

- verify functionality
- verify types
- verify existing UI still works

---

# 113. Final Technical Direction

MyCash should use a straightforward full-stack architecture:

```text
Next.js
   │
   ├── Server Components
   ├── Server Actions
   └── Supabase SSR session
   │
   ▼
Supabase
   ├── Auth
   └── PostgreSQL
        ├── profiles
        ├── categories
        └── expenses
             +
            RLS
```

The backend should feel intentionally engineered, not generated through unnecessary layers.

Priority order:

```text
Security
Correctness
Data integrity
Maintainability
Performance
Developer experience
```

The final system must replace frontend mock data with secure real data while preserving the frontend UX already established in the frontend phase.

# PRD — Ledger
## Frontend-First Personal Expense Tracker

**Version:** 1.0  
**Status:** Frontend Phase  
**Product Type:** Personal Finance / Expense Management  
**Primary Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui  
**Design System:** UI/UX Pro Max  
**Backend:** Deferred to a later phase — do not implement backend/Supabase yet

---

# 1. Product Overview

Ledger adalah aplikasi web untuk membantu pengguna mencatat, melihat, mencari, dan memahami pengeluaran pribadi.

Produk dibangun dengan pendekatan **frontend-first**.

Pada fase ini, fokus hanya pada:

- information architecture
- UI/UX
- responsive layout
- component architecture
- form interaction
- client-side state
- mock data
- loading state
- empty state
- error state
- visual consistency
- accessibility

**Backend, database, Supabase Auth, Supabase PostgreSQL, RLS, Server Actions, dan API belum boleh diimplementasikan pada fase ini.**

Mock data harus dibuat sedemikian rupa sehingga nantinya mudah diganti dengan data dari backend tanpa perlu merombak UI.

---

# 2. Product Goals

## Primary Goals

1. Membuat pengalaman pencatatan pengeluaran yang cepat.
2. Menampilkan kondisi pengeluaran secara jelas.
3. Membuat pengguna dapat menemukan transaksi dengan mudah.
4. Membuat UI terasa profesional dan bukan template dashboard generik.
5. Membuat frontend memiliki struktur yang siap diintegrasikan dengan backend pada fase berikutnya.
6. Menjaga komponen tetap reusable dan mudah dipelihara.

## Secondary Goals

- Responsive pada desktop, tablet, dan mobile.
- Accessible.
- Memiliki feedback visual yang jelas.
- Memiliki empty, loading, dan error state.
- Menggunakan design system yang konsisten.

---

# 3. Non-Goals — Frontend Phase

Hal berikut **JANGAN diimplementasikan sekarang**:

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security
- API
- Server Actions untuk database
- Route Handlers untuk database
- CRUD database
- database migrations
- database schema
- service role key
- real authentication
- real-time subscription
- deployment backend

Jika membutuhkan data, gunakan **local mock data**.

---

# 4. Target User

Target utama:

> Individu yang ingin mencatat dan memahami pengeluaran sehari-hari tanpa menggunakan sistem akuntansi yang rumit.

Karakteristik:

- membutuhkan input yang cepat
- ingin mengetahui total pengeluaran
- ingin mengetahui kategori pengeluaran terbesar
- sering menggunakan smartphone
- tidak membutuhkan istilah akuntansi yang kompleks

---

# 5. Product Principles

## 5.1 Clarity Over Decoration

Informasi finansial harus mudah dipahami.

Jangan menggunakan dekorasi yang mengganggu data.

## 5.2 Fast Interaction

Menambahkan pengeluaran harus membutuhkan sedikit langkah.

## 5.3 Progressive Disclosure

Informasi penting tampil terlebih dahulu.

Detail tambahan hanya ditampilkan ketika dibutuhkan.

## 5.4 Consistency

Komponen dengan fungsi yang sama harus terlihat dan berperilaku konsisten.

## 5.5 Realistic Product Design

UI harus terasa seperti produk yang benar-benar dapat digunakan, bukan demo AI.

---

# 6. Anti AI-Slop Requirements

Desain WAJIB menghindari pola UI generatif yang umum.

Jangan menggunakan:

- excessive gradients
- glassmorphism berlebihan
- neon glow
- random decorative blobs
- terlalu banyak rounded cards
- terlalu banyak shadow
- setiap informasi dijadikan card
- statistik palsu
- chart dekoratif
- badge yang tidak memiliki fungsi
- emoji sebagai icon UI
- oversized heading
- excessive whitespace
- purple/blue gradient SaaS template
- animasi berlebihan
- icon yang tidak memiliki fungsi
- section yang hanya dibuat untuk memenuhi halaman
- copy generik seperti "Welcome back!" tanpa konteks
- dashboard yang terlihat seperti template admin generator

Gunakan visual hierarchy yang tenang.

Prioritaskan:

- typography
- spacing
- alignment
- contrast
- grouping
- content hierarchy
- interaction clarity

---

# 7. UI/UX Pro Max

Gunakan:

https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Skill tersebut harus digunakan sebelum implementasi visual utama.

## Design Brief

**Product:** Personal Expense Tracker

**Audience:** Individual users

**Platform:** Responsive web

**Framework:** Next.js

**UI Library:** shadcn/ui

**CSS:** Tailwind CSS

**Tone:** Professional, calm, trustworthy, modern

**Density:** Medium

**Primary UX Goal:** Fast expense entry and clear financial overview

---

# 8. Design System Requirements

Sebelum membuat halaman utama, tentukan:

- typography system
- color tokens
- spacing system
- border radius
- shadows
- button hierarchy
- input states
- card behavior
- table behavior
- dialog behavior
- responsive breakpoints
- icon usage
- feedback states

Gunakan design token yang konsisten.

Jangan memilih style secara acak per halaman.

---

# 9. Information Architecture

Struktur navigasi utama:

```text
Dashboard
Expenses
Categories
Settings
```

Auth page:

```text
Login
Register
```

Pada frontend phase, Login/Register hanya berupa UI.

Tidak ada autentikasi nyata.

---

# 10. Route Structure

Gunakan App Router.

```text
/
├── login
├── register
└── dashboard
    ├── expenses
    ├── categories
    └── settings
```

Root `/` dapat diarahkan ke dashboard sementara selama frontend development atau menampilkan landing/entry screen sederhana.

Jangan membuat landing page marketing yang tidak diperlukan.

---

# 11. Global Application Shell

Authenticated-style pages menggunakan:

```text
Sidebar
+
Main Content
```

Desktop:

```text
┌──────────────┬────────────────────────────────┐
│              │                                │
│   Sidebar    │          Main Content          │
│              │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────────────────────────────┐
│ Header                         Menu          │
├──────────────────────────────────────────────┤
│                                              │
│              Main Content                    │
│                                              │
└──────────────────────────────────────────────┘
```

Sidebar tidak boleh dipaksakan pada layar kecil.

Gunakan Sheet/Drawer atau pola navigasi mobile yang lebih sesuai.

---

# 12. Sidebar

Navigation:

- Dashboard
- Expenses
- Categories
- Settings

Bottom section:

- user profile placeholder
- logout UI

Logout belum memiliki fungsi backend.

Gunakan avatar placeholder atau initials.

---

# 13. Dashboard

Dashboard adalah halaman utama.

Dashboard harus menjawab:

1. Berapa total pengeluaran?
2. Berapa transaksi?
3. Pengeluaran rata-rata berapa?
4. Kategori mana yang paling banyak menghabiskan uang?
5. Pengeluaran terakhir apa saja?
6. Bagaimana pola pengeluaran berdasarkan waktu?

---

# 14. Dashboard Layout

Struktur yang direkomendasikan:

```text
Page Header
↓
Period Filter
↓
Summary Metrics
↓
Spending Trend + Category Breakdown
↓
Recent Expenses
```

Jangan membuat terlalu banyak section.

---

# 15. Dashboard Header

Contoh:

```text
Dashboard

Overview of your spending
```

Copy harus singkat.

Jangan menggunakan copy marketing yang tidak diperlukan.

---

# 16. Period Filter

UI menyediakan:

- This month
- Last month
- Last 3 months
- This year
- Custom range

Pada frontend phase, perubahan filter cukup mengubah mock state/data.

Belum perlu query backend.

---

# 17. Summary Metrics

Metrics:

### Total Spending

Contoh:

```text
Rp 4.250.000
```

### Transactions

Contoh:

```text
42
```

### Average Expense

Contoh:

```text
Rp 101.190
```

### Top Category

Contoh:

```text
Food
```

Jangan membuat persentase pertumbuhan palsu.

Jika menampilkan comparison, gunakan data mock yang benar-benar mendukung perhitungan tersebut.

---

# 18. Spending Trend

Gunakan satu chart utama.

Tujuan:

Menunjukkan perubahan total pengeluaran berdasarkan waktu.

Contoh:

```text
Week 1
Week 2
Week 3
Week 4
```

Chart harus:

- readable
- responsive
- memiliki tooltip
- memiliki label yang jelas
- tidak terlalu dekoratif
- memiliki empty state

---

# 19. Category Breakdown

Gunakan donut/pie chart jika memang membantu.

Tampilkan:

- category
- total amount
- percentage

Contoh:

```text
Food          Rp 1.200.000
Bills         Rp 900.000
Transport     Rp 550.000
Shopping      Rp 400.000
Other         Rp 200.000
```

Jangan menggunakan terlalu banyak warna.

---

# 20. Recent Expenses

Tampilkan transaksi terbaru.

Columns desktop:

```text
Date
Description
Category
Payment Method
Amount
```

Actions dapat menggunakan menu.

Mobile:

Gunakan compact transaction list.

Jangan hanya mengecilkan table desktop.

---

# 21. Expenses Page

Halaman Expenses digunakan untuk mengelola seluruh transaksi.

Struktur:

```text
Page Header
↓
Add Expense Button
↓
Search + Filters
↓
Expense Table/List
↓
Pagination
```

---

# 22. Expense Search

Search berdasarkan:

- description
- notes

Frontend phase:

- gunakan mock data
- filter menggunakan client-side state

Backend search belum diperlukan.

---

# 23. Expense Filters

Filter:

- date range
- category
- payment method
- amount range jika diperlukan

Sediakan:

```text
Reset filters
```

Jangan membuat filter interface terlalu padat.

Advanced filters dapat ditempatkan dalam popover/sheet.

---

# 24. Expense Sorting

Sorting:

- newest
- oldest
- highest amount
- lowest amount

Default:

```text
Newest
```

---

# 25. Expense Table

Desktop:

```text
┌────────┬──────────────┬───────────┬────────────┬────────────┐
│ Date   │ Description  │ Category  │ Method     │ Amount     │
├────────┼──────────────┼───────────┼────────────┼────────────┤
│ 16 Sep │ Lunch        │ Food      │ Cash       │ Rp 35.000  │
│ 15 Sep │ Internet     │ Bills     │ Transfer   │ Rp 250.000 │
└────────┴──────────────┴───────────┴────────────┴────────────┘
```

Action menu:

- Edit
- Delete

---

# 26. Mobile Expense List

Mobile layout:

```text
Lunch
Food · Cash

16 Sep 2026                 Rp 35.000
```

Setiap item tetap menyediakan action.

---

# 27. Add Expense

Use Dialog/Sheet depending on UX evaluation.

Fields:

- Amount
- Description
- Category
- Date
- Payment Method
- Notes

Validation:

- amount required
- amount > 0
- description required
- category required
- date required
- valid payment method

Frontend phase only.

Submit cukup memodifikasi mock state.

---

# 28. Edit Expense

Gunakan form yang sama dengan Add Expense.

Mode:

```text
create
edit
```

Jangan membuat dua form yang identik.

Saat Edit:

- preload data
- user dapat mengubah data
- submit memperbarui mock state
- tampilkan success feedback

---

# 29. Delete Expense

Gunakan AlertDialog.

Copy:

```text
Delete expense?

This action cannot be undone.
```

Actions:

```text
Cancel
Delete
```

Frontend phase:

Delete hanya menghapus dari mock state.

---

# 30. Categories Page

User dapat melihat kategori.

UI:

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

Setiap kategori dapat:

- edit
- delete

Tambah kategori menggunakan Dialog.

---

# 31. Category Form

Fields:

- Name
- Icon
- Color

Validasi:

- name required
- name tidak boleh kosong
- panjang reasonable

Icon picker harus sederhana.

Jangan membuat icon picker yang terlalu kompleks.

---

# 32. Category Delete UX

Jika kategori sedang digunakan oleh mock expense:

Tampilkan warning.

Contoh:

```text
This category is used by existing expenses.
```

Pada frontend phase, simulasi behavior secara lokal.

Backend handling akan ditentukan pada fase database.

---

# 33. Settings Page

Settings hanya berisi hal yang relevan.

Sections:

### Profile

- Name
- Email placeholder
- Avatar placeholder

### Preferences

- Currency
- Theme

### Account

- Logout

Karena backend belum dibuat, perubahan hanya bersifat frontend state.

---

# 34. Authentication UI

## Login

Fields:

- Email
- Password

Actions:

- Login
- Forgot password placeholder jika ingin ditampilkan

## Register

Fields:

- Name
- Email
- Password
- Confirm password

Frontend validation harus berjalan.

Authentication sebenarnya belum diimplementasikan.

---

# 35. Currency Formatting

Gunakan formatter reusable.

Input:

```text
35000
```

Display:

```text
Rp 35.000
```

Jangan menyimpan format:

```text
"Rp 35.000"
```

sebagai value internal.

Mock data tetap menggunakan numeric amount.

---

# 36. Date Formatting

Display:

```text
16 September 2026
```

Compact:

```text
16 Sep
```

Gunakan utility formatter.

---

# 37. Mock Data

Buat realistic mock data.

Contoh:

```ts
type Expense = {
    id: string;
    amount: number;
    description: string;
    categoryId: string;
    categoryName: string;
    paymentMethod: string;
    expenseDate: string;
    notes?: string;
};
```

Gunakan data yang masuk akal.

Jangan membuat data:

```text
John Doe
Lorem Ipsum
Test Expense 1
Test Expense 2
```

Gunakan konteks Indonesia.

Contoh:

```text
Makan siang
Transport kantor
Internet bulanan
Belanja kebutuhan rumah
Kopi
Pulsa
Parkir
```

---

# 38. Mock Data Architecture

Pisahkan mock data dari components.

Contoh:

```text
src/
    data/
        mock-expenses.ts
        mock-categories.ts
        mock-user.ts
```

UI tidak boleh memiliki hardcoded transaction data di dalam JSX.

---

# 39. State Architecture

Gunakan client state hanya ketika dibutuhkan.

Contoh:

- modal open/close
- form state
- search
- filters
- sorting
- mock expense mutations
- theme preference

Jangan menggunakan global state library jika React state sudah cukup.

Jangan menambahkan Zustand/Redux tanpa kebutuhan nyata.

---

# 40. Component Architecture

Gunakan reusable components.

Contoh:

```text
components/
    layout/
        app-sidebar.tsx
        app-header.tsx
        mobile-nav.tsx

    dashboard/
        summary-metrics.tsx
        spending-chart.tsx
        category-breakdown.tsx
        recent-expenses.tsx

    expenses/
        expense-table.tsx
        expense-list.tsx
        expense-form.tsx
        expense-dialog.tsx
        expense-filters.tsx
        delete-expense-dialog.tsx

    categories/
        category-list.tsx
        category-form.tsx
        category-dialog.tsx

    ui/
        ...
```

Jangan membuat component hanya untuk membungkus satu element tanpa alasan.

---

# 41. Client / Server Boundary

Walaupun backend belum dibuat, tetap gunakan arsitektur Next.js yang sehat.

Default:

- Server Component

Gunakan Client Component hanya untuk:

- interactive forms
- dialogs
- dropdowns
- filters
- charts
- local state
- browser APIs

Jangan menjadikan seluruh application sebagai:

```tsx
"use client";
```

---

# 42. shadcn/ui

Gunakan shadcn/ui sebagai foundation.

Komponen yang mungkin diperlukan:

- Button
- Card
- Input
- Label
- Dialog
- AlertDialog
- Sheet
- Select
- Popover
- Calendar
- Command
- Table
- Badge
- Skeleton
- Tooltip
- DropdownMenu
- Separator
- Avatar
- Tabs

Install hanya komponen yang benar-benar digunakan.

---

# 43. Icons

Gunakan Lucide React.

Rules:

- icon harus memiliki tujuan
- jangan menggunakan emoji sebagai icon
- jangan mencampur banyak icon library

---

# 44. Responsive Requirements

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

Pastikan:

- sidebar berubah pada mobile
- table berubah menjadi list
- dialog tidak keluar layar
- chart responsive
- filter tidak overflow
- button tidak terlalu kecil
- typography tetap readable

---

# 45. Accessibility

Implementasikan:

- semantic HTML
- label yang jelas
- keyboard navigation
- focus state
- accessible dialogs
- accessible dropdown
- sufficient contrast
- aria-label hanya ketika dibutuhkan
- reduced motion support

Icon-only buttons wajib memiliki tooltip atau accessible label.

---

# 46. Loading States

Walaupun masih mock data, siapkan loading architecture.

Gunakan Skeleton untuk:

- dashboard metrics
- chart
- recent expenses
- expense list

Skeleton harus menyerupai struktur konten asli.

---

# 47. Empty States

Dashboard tanpa transaksi:

```text
Belum ada pengeluaran

Catat pengeluaran pertama untuk mulai melihat pola pengeluaranmu.

Tambah Pengeluaran
```

Expense page:

```text
Belum ada transaksi
```

Search:

```text
Tidak ada transaksi yang cocok dengan pencarian.
```

Category:

```text
Belum ada kategori.
```

---

# 48. Error States

Siapkan UI untuk error.

Contoh:

```text
Something went wrong.

Data tidak dapat ditampilkan saat ini.
```

Button:

```text
Coba Lagi
```

Untuk frontend phase, error dapat disimulasikan menggunakan local state.

---

# 49. Feedback

Gunakan toast secara selektif.

Contoh:

```text
Pengeluaran berhasil ditambahkan.
```

```text
Pengeluaran berhasil diperbarui.
```

```text
Pengeluaran berhasil dihapus.
```

Jangan menampilkan toast untuk setiap interaction kecil.

---

# 50. Animation

Gunakan subtle animation saja.

Boleh:

- dialog transition
- sheet transition
- hover
- dropdown
- toast
- skeleton

Hindari:

- bouncing
- excessive motion
- animated gradient
- floating elements
- parallax
- unnecessary page transitions

---

# 51. Dark Mode

Jika design system memilih dark mode, implementasikan secara intentional.

Pastikan:

- chart tetap readable
- border terlihat
- muted text tetap readable
- input jelas
- dialog jelas

Jangan hanya membalik warna secara otomatis.

---

# 52. Performance

Frontend harus:

- menghindari unnecessary re-render
- menggunakan Server Components secara default
- tidak menjadikan semua component client
- tidak mengirim mock dataset besar ke browser
- tidak menggunakan dependency yang tidak diperlukan

Jangan melakukan premature optimization.

---

# 53. SEO / Metadata

Set metadata dasar:

```text
title
description
```

Contoh:

```text
Ledger — Personal Expense Tracker
```

Description:

```text
Track and understand your personal spending.
```

---

# 54. Project Structure

Recommended:

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── expenses/
│   │   │   └── page.tsx
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── expenses/
│   └── categories/
│
├── data/
│   ├── mock-expenses.ts
│   ├── mock-categories.ts
│   └── mock-user.ts
│
├── lib/
│   ├── formatters.ts
│   ├── utils.ts
│   └── validations/
│
└── types/
    ├── expense.ts
    └── category.ts
```

Adjust only if there is a clear architectural reason.

---

# 55. Validation

Use Zod for frontend validation.

Use React Hook Form for complex forms.

Schemas:

```text
expenseSchema
categorySchema
loginSchema
registerSchema
```

Validation errors should be displayed near the relevant field.

---

# 56. No Backend Yet

This rule is absolute for Phase 1.

DO NOT:

```text
create Supabase client
```

DO NOT:

```text
create database migrations
```

DO NOT:

```text
create RLS policies
```

DO NOT:

```text
create Server Actions for database mutations
```

DO NOT:

```text
create API endpoints
```

DO NOT:

```text
connect to PostgreSQL
```

The UI must be completely functional using mock/local data.

---

# 57. Future Backend Compatibility

Even though backend is deferred, design interfaces so future data integration is straightforward.

Prefer domain types:

```ts
Expense
Category
UserProfile
```

rather than coupling components to a future database response.

Example:

```ts
ExpenseTable
```

should receive:

```ts
expenses: Expense[]
```

instead of directly fetching data.

Later, the data source can change from:

```text
mock data
```

to:

```text
Supabase
```

without redesigning the component.

---

# 58. Definition of Done — Frontend

Frontend Phase is complete only when:

## Pages

- [ ] Login
- [ ] Register
- [ ] Dashboard
- [ ] Expenses
- [ ] Categories
- [ ] Settings

## Dashboard

- [ ] Summary metrics
- [ ] Period filter
- [ ] Spending chart
- [ ] Category breakdown
- [ ] Recent expenses
- [ ] Empty state
- [ ] Loading state

## Expenses

- [ ] Search
- [ ] Filters
- [ ] Sorting
- [ ] Add
- [ ] Edit
- [ ] Delete
- [ ] Confirmation dialog
- [ ] Desktop table
- [ ] Mobile list

## Categories

- [ ] List
- [ ] Add
- [ ] Edit
- [ ] Delete
- [ ] Empty state

## Forms

- [ ] Validation
- [ ] Loading state
- [ ] Error state
- [ ] Success feedback

## UX

- [ ] Responsive
- [ ] Accessible
- [ ] Keyboard friendly
- [ ] Consistent design system
- [ ] Clear hierarchy
- [ ] No AI-slop patterns

## Engineering

- [ ] TypeScript strict
- [ ] No unnecessary `any`
- [ ] No unnecessary global state
- [ ] Components reusable
- [ ] Mock data separated from UI
- [ ] Server/client boundaries intentional
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Production build passes

---

# 59. Frontend Review Checklist

Before declaring completion, inspect every page at:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Review:

### Visual

- [ ] Typography
- [ ] Spacing
- [ ] Alignment
- [ ] Contrast
- [ ] Borders
- [ ] Shadows
- [ ] Radius
- [ ] Icons
- [ ] Component consistency

### UX

- [ ] Primary action obvious
- [ ] Forms easy to understand
- [ ] Errors understandable
- [ ] Empty states useful
- [ ] Destructive actions confirmed
- [ ] Mobile interaction practical

### Anti AI-Slop

- [ ] No unnecessary gradients
- [ ] No excessive cards
- [ ] No fake metrics
- [ ] No fake charts
- [ ] No decorative icon spam
- [ ] No unnecessary animations
- [ ] No generic AI dashboard appearance

---

# 60. Development Sequence

Implement strictly in this order:

## Step 1 — Project Foundation

- initialize Next.js
- TypeScript
- Tailwind
- shadcn/ui
- ESLint
- basic global styles

## Step 2 — Design System

Use UI/UX Pro Max.

Define:

- typography
- colors
- spacing
- components
- responsive rules

## Step 3 — Application Shell

Build:

- sidebar
- header
- mobile navigation
- layout

## Step 4 — Mock Data

Create:

- expenses
- categories
- user

## Step 5 — Dashboard

Build:

- metrics
- period filter
- chart
- category breakdown
- recent expenses

## Step 6 — Expenses

Build:

- table
- mobile list
- search
- filters
- sorting
- add
- edit
- delete

## Step 7 — Categories

Build:

- category list
- create
- edit
- delete

## Step 8 — Settings

Build:

- profile
- preferences
- theme

## Step 9 — Auth UI

Build:

- login
- register

No real authentication.

## Step 10 — Responsive Refinement

Review mobile/tablet/desktop.

## Step 11 — Accessibility Review

Fix accessibility issues.

## Step 12 — AI-Slop Review

Remove generic/generated visual patterns.

## Step 13 — Quality Checks

Run:

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npm run build
```

---

# 61. Important Agent Instruction

Do not jump directly to backend.

Do not install Supabase dependencies yet.

Do not create database files yet.

Do not create authentication logic yet.

Complete the frontend experience first.

The frontend must be fully usable with mock data before Phase 2 begins.

When the frontend phase is complete, stop and report:

1. implemented pages
2. implemented components
3. mock data structure
4. remaining frontend issues
5. verification results
6. suggested backend integration points

Do not automatically continue into backend implementation.

---

# 62. Final Product Direction

The final frontend should feel like:

> A polished personal finance product designed for everyday use.

It should NOT feel like:

> An AI-generated admin dashboard.

Prioritize restraint, clarity, usability, consistency, and realistic product behavior.

Every visual element must have a purpose.

Every interaction must have predictable feedback.

Every page must support an actual user task.

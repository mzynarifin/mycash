# MyCash

Portal **billing & pembayaran** berbasis web dengan dua area produk terpisah: **Admin** dan **User**. Admin mengelola akun user dan tagihan; user melihat tagihan, membayar (QRIS, bisa dicicil), mengunggah bukti, dan memantau status verifikasi.

- **Stack:** Next.js (App Router) + Supabase (Auth, Postgres, Storage, RLS) + TypeScript + Tailwind CSS
- **Locale / Currency:** `id-ID` / `IDR`
- **Roles:** `admin`, `user`

> Dokumen kebutuhan produk: [`mycash-master-prd-admin-user.md`](./mycash-master-prd-admin-user.md).

---

## Daftar Isi

1. [Ringkasan Fitur](#1-ringkasan-fitur)
2. [Alur Bisnis](#2-alur-bisnis)
3. [Tech Stack](#3-tech-stack)
4. [Arsitektur & Struktur Folder](#4-arsitektur--struktur-folder)
5. [Menjalankan Proyek](#5-menjalankan-proyek)
6. [Environment Variables](#6-environment-variables)
7. [Skema Database](#7-skema-database)
8. [Autentikasi & Otorisasi](#8-autentikasi--otorisasi)
9. [Alur Pembayaran](#9-alur-pembayaran)
10. [Storage Bukti Pembayaran](#10-storage-bukti-pembayaran)
11. [Audit Log](#11-audit-log)
12. [Scripts](#12-scripts)
13. [Keamanan](#13-keamanan)
14. [Kualitas Kode](#14-kualitas-kode)
15. [Deployment](#15-deployment)
16. [Batasan & Roadmap](#16-batasan--roadmap)

---

## 1. Ringkasan Fitur

### Admin
| Area | Kemampuan |
|------|-----------|
| User Management | Buat user (NIM + password), edit, suspend/reactivate, hapus, cari, filter, paginasi |
| Billing Management | Buat/edit tagihan, assign ke satu/beberapa/semua user aktif, batalkan, arsipkan, hapus |
| Payment Verification | Antrean pembayaran **Menunggu Verifikasi**, verifikasi, tolak dengan alasan wajib, lihat bukti |
| Dashboard | User aktif, tagihan aktif, nilai belum lunas, pembayaran menunggu, tagihan jatuh tempo, aktivitas audit |
| Audit Log | Riwayat aksi administratif (append-only) |

### User
| Area | Kemampuan |
|------|-----------|
| Dashboard | Ringkasan total belum dibayar, tagihan aktif, menunggu verifikasi, pembayaran berhasil, tagihan terdekat, riwayat |
| Tagihan | Lihat tagihan miliknya, filter status, progress pembayaran, tombol Bayar |
| Pembayaran | Bayar via QRIS (penuh atau **cicilan**), unggah bukti, lihat riwayat & status |
| Pengaturan | Preferensi akun |

**User tidak bisa** membuat tagihan, mengubah nominal, mengubah status pembayaran, atau mengakses area admin.

---

## 2. Alur Bisnis

```
Admin tambah user (NIM + password)
        │
        ▼
User login pakai NIM + password
        │
        ▼
Admin buat tagihan → assign ke user (satu/beberapa/semua user aktif)
        │
        ▼
Tagihan otomatis muncul di dashboard & /bills user
        │
        ▼
User bayar via QRIS (bisa dicicil) + unggah bukti
        │
        ▼
Pembayaran tersimpan status = pending ("Menunggu Verifikasi")
        │
        ▼
Admin verifikasi / tolak (alasan wajib) dari /admin/payments
        │
        ▼
User melihat status di riwayat: Berhasil / Ditolak / Menunggu Verifikasi
```

Sisa tagihan dihitung dari `SUM(pembayaran verified)` dan berkurang tiap cicilan. Hanya pembayaran **verified** yang mengurangi tagihan.

---

## 3. Tech Stack

**Framework & Bahasa**
- [Next.js 16](https://nextjs.org) — App Router, Turbopack, React Compiler aktif (`next.config.ts`)
- React 19
- TypeScript 5

**UI**
- Tailwind CSS v4
- [Base UI](https://base-ui.com) (`@base-ui/react`) — komponen bergaya shadcn/ui
- lucide-react, sonner (toast), next-themes (tema), cmdk, react-day-picker, recharts

**Data & Backend**
- Supabase: Auth, Postgres, Storage, Row Level Security
- `@supabase/ssr` + `@supabase/supabase-js`
- Zod (validasi server-side) + react-hook-form (form)
- date-fns (format tanggal `id-ID`)

**Pola**
- Server Components untuk baca data
- Server Actions untuk mutasi (validasi + otorisasi)
- RLS sebagai lapis otorisasi di database

---

## 4. Arsitektur & Struktur Folder

```
src/
├── app/
│   ├── (auth)/                 # login, forgot-password, reset-password, register
│   ├── (dashboard)/            # area user: dashboard, bills, payments, settings
│   ├── admin/                  # area admin: dashboard, users, bills, payments, audit-logs
│   ├── layout.tsx              # root layout (font, providers)
│   ├── page.tsx                # redirect → /dashboard
│   ├── robots.ts, sitemap.ts
│
├── actions/                    # Server Actions ("use server")
│   ├── auth-actions.ts         # login NIM, logout, reset password
│   ├── admin-user-actions.ts   # create/update/delete user, set status
│   ├── admin-bill-actions.ts   # create/update/cancel/archive/delete/assign bill
│   ├── admin-payment-actions.ts# verify / reject payment
│   ├── payment-actions.ts      # submit payment (user)
│   ├── proof-actions.ts        # signed upload URL bukti
│   ├── profile-actions.ts
│   └── types.ts                # ActionResult<T>
│
├── lib/
│   ├── supabase/               # client (browser), server, middleware, admin (service role)
│   ├── queries/                # pembacaan data (server components)
│   ├── validations/            # skema Zod
│   ├── auth/roles.ts           # resolusi role dari user_roles
│   ├── payments.ts             # helper proof URL & deteksi cicilan
│   ├── audit.ts                # writeAuditLog
│   ├── revalidation.ts         # revalidatePath per domain
│   ├── formatters.ts           # formatCurrency / tanggal (id-ID)
│   └── payment-methods.ts      # daftar & label metode pembayaran
│
├── components/
│   ├── admin/                  # shell, tabel, dialog (users, bills, payments, dashboard)
│   ├── auth/                   # form login/reset
│   ├── bills/ payments/ dashboard/  # komponen user
│   ├── layout/                 # app-shell, page-header, skeleton
│   ├── providers/ ui/          # provider & komponen dasar
│   └── theme-provider.tsx
│
├── types/                      # tipe domain + Database (generated-style)
└── middleware.ts               # proteksi route & redirect berbasis role
```

**Pemisahan tanggung jawab**
- `lib/queries/*` — hanya baca data (dipanggil Server Component), memakai row-level scoping.
- `actions/*` — `"use server"`, memvalidasi Zod, memverifikasi role, menulis audit, lalu `revalidatePath`.
- `lib/supabase/admin.ts` — service role, **hanya server-side**, tidak pernah diimpor ke Client Component.

---

## 5. Menjalankan Proyek

### Prasyarat
- Node.js 20+ (disarankan 20/22)
- Proyek Supabase (hosted atau self-hosted)
- npm

### Langkah

```bash
# 1. Install dependency
npm install

# 2. Siapkan environment
cp .env.example .env.local   # lalu isi nilainya (lihat bagian 6)

# 3. Setup database: terapkan migrasi + seed data demo
npm run db:setup

# 4. Jalankan
npm run dev
```

Buka <http://localhost:3000>.

### Setup database (`npm run db:setup`)

`scripts/setup-db.mjs` akan:
1. Menerapkan **semua** migrasi di `supabase/migrations/*.sql` (urut) via Management API — butuh `SUPABASE_ACCESS_TOKEN`.
2. Mengambil & menyimpan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local` bila belum ada.
3. Membuat akun demo + data contoh.

Akun admin (login pakai **NIM**):

| NIM | Password | Role |
|-----|----------|------|
| `241011400261` | `Admin123!` | admin |

> Ganti password ini setelah login pertama. Akun user dibuat oleh admin dari `/admin/users` (NIM + password).
> Jika `SUPABASE_ACCESS_TOKEN` tidak diisi, langkah migrasi dilewati dan hanya seeding yang dijalankan (tabel harus sudah ada).

---

## 6. Environment Variables

Buat `.env.local`:

| Variabel | Wajib | Keterangan |
|----------|:-----:|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Publishable/anon key (browser + server) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key untuk operasi privileged **server-side** (create user, review pembayaran, storage). Jangan pernah diekspos ke client |
| `SUPABASE_ACCESS_TOKEN` | ➖ | Personal Access Token, hanya untuk `npm run db:setup` (menerapkan migrasi) |

Daftar lengkap ada di [`.env.example`](./.env.example).

> `.env*` sudah di-`.gitignore` — jangan commit kredensial.

---

## 7. Skema Database

Migrasi ada di [`supabase/migrations`](./supabase/migrations) (001–015). Semua tabel mengekspos RLS.

### Tabel inti

| Tabel | Kolom kunci | Keterangan |
|-------|-------------|------------|
| `profiles` | `id` (FK `auth.users`), `full_name`, `nim` (unik), `avatar_url`, `currency`, `theme`, `email`, `is_suspended` | Data profil; `nim` = identitas login |
| `user_roles` | `user_id`, `role` (`user`/`admin`) | Sumber kebenaran role (tidak user-editable) |
| `bills` | `id`, `title`, `description`, `category`, `amount`, `issue_date`, `due_date`, `status` (`active`/`cancelled`/`archived`), `created_by` | Definisi tagihan (dibuat admin) |
| `bill_assignments` | `id`, `bill_id`, `user_id`, `assigned_at` — unik `(bill_id, user_id)` | Menghubungkan tagihan ke user |
| `payments` | `id`, `assignment_id`, `user_id`, `amount`, `payment_method`, `payment_date`, `status` (`pending`/`verified`/`rejected`), `reference`, `notes`, `proof_object`, `reviewed_by`, `reviewed_at`, `reject_reason` | Pembayaran per assignment (mendukung cicilan) |
| `audit_logs` | `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `detail`, `created_at` | Append-only |

### Tabel warisan (tidak dipakai di UI user)

| Tabel | Keterangan |
|-------|------------|
| `categories`, `expenses` | Pelacak pengeluaran pribadi. **Backend tetap ada**, namun UI user sudah dihapus karena scope produk kini murni billing portal |

### Relasi

```
auth.users 1─1 profiles
auth.users 1─* user_roles
bills 1─* bill_assignments *─1 auth.users
bill_assignments 1─* payments
auth.users 1─* payments
```

### Enum / nilai terdefinisi

- **Bill category:** `Pendidikan`, `Keanggotaan`, `Layanan`, `Iuran`, `Administrasi`, `Lainnya`
- **Bill status:** `active`, `cancelled`, `archived`
- **Payment method:** `qris`, `cash`, `bank_transfer`, `e_wallet`, `debit_card`, `credit_card`, `other`
- **Payment status:** `pending`, `verified`, `rejected`
- **Money:** `numeric` (bukan float)

---

## 8. Autentikasi & Otorisasi

### Login dengan NIM

Supabase Auth butuh email, jadi MyCash memetakan NIM ke email internal `{nim}@mycash.local`.

```
User input NIM + password
        │
        ▼
Server cari profil berdasarkan NIM  →  ambil email internal
        │
        ▼
supabase.auth.signInWithPassword(email internal, password)
        │
        ▼
Cek status suspend → resolve role → redirect
        │
        ├── admin → /admin/dashboard
        └── user  → /dashboard
```

Error selalu generik: **"NIM atau password tidak sesuai."** (tidak membocorkan detail Supabase).

### Role-Based Access Control

Otorisasi berlapis (**route + server action + RLS**):

| Lapis | Implementasi |
|-------|--------------|
| Route (edge) | `src/middleware.ts` — redirect admin dari route user, user dari route admin, suspended ke `/login` |
| Server Action | `getUserRoleFromClient` + `requireAdmin` sebelum mutasi |
| Database | RLS + fungsi `public.is_admin()` (SECURITY DEFINER) |

Route yang dilindungi: `/admin/*`, `/dashboard`, `/bills`, `/payments`, `/settings`. Halaman root `/` diarahkan ke `/dashboard`.

Pendaftaran publik (`/register`) dinonaktifkan — akun hanya dibuat admin.

---

## 9. Alur Pembayaran

### User membayar
1. Buka `/bills` → klik **Bayar** (hanya muncul bila tagihan masih bisa dibayar).
2. Dialog: nominal (boleh **sebagian/cicilan**), tanggal, referensi, catatan, dan **unggah bukti** (opsional, JPG/PNG/WEBP/PDF ≤ 5 MB).
3. `submitPaymentAction` memverifikasi kepemilikan assignment, status tagihan aktif, dan `amount ≤ sisa tagihan`, lalu menyimpan `status = pending`.
4. Sisa tagihan dihitung dari `SUM(verified)`; pembayaran `pending` tidak mengurangi tagihan.

### Admin memverifikasi
- `/admin/payments` default menampilkan antrean **Menunggu Verifikasi**.
- **Verifikasi:** update atomik `.eq("status", "pending")` → `verified` (mencegah proses ganda). Progress tagihan ikut naik.
- **Tolak:** wajib isi alasan → `rejected`; alasan tampil di riwayat user.
- Admin melihat badge **Cicilan** bila `amount < nominal tagihan`.

Pembayaran yang sudah `verified`/`rejected` tidak bisa diproses ulang.

---

## 10. Storage Bukti Pembayaran

- Bucket Supabase Storage: **`bukti-pembayaran`** (public read, write via signed URL).
- Alur: `createProofUploadAction` menghasilkan signed upload URL dengan path wajib `{user_id}/{uuid}.{ext}`; klien mengunggah langsung ke Storage; path disimpan di `payments.proof_object`.
- Validasi tipe (JPG/PNG/WEBP/PDF) dan ukuran (≤ 5 MB) di server action.
- RLS `storage.objects` membatasi user hanya ke folder miliknya.
- URL publik dibentuk oleh `getProofUrl()` (`lib/payments.ts`).

---

## 11. Audit Log

Aksi administratif penting dicatat via `writeAuditLog()` (best-effort, kegagalan tidak menggagalkan operasi utama):

```
user.create · user.update · user.delete · user.suspend · user.reactivate
bill.create · bill.update · bill.cancel · bill.archive · bill.delete · bill.assign
payment.verify · payment.reject
```

Audit log bersifat **append-only** (tidak ada policy update/delete untuk aplikasi) dan hanya bisa dibaca admin.

---

## 12. Scripts

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan server development |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | Jalankan ESLint |
| `npm run db:setup` | Terapkan migrasi + seed data demo |

Pemeriksaan tipe: `npx tsc --noEmit`.

---

## 13. Keamanan

- Semua mutasi lewat **Server Action** yang memverifikasi sesi + role.
- **Service role key tidak pernah** diekspos ke client; hanya dipakai modul server-side (`lib/supabase/admin.ts`).
- **RLS aktif** di seluruh tabel aplikasi (`profiles`, `user_roles`, `bills`, `bill_assignments`, `payments`, `audit_logs`, dll).
- Role disimpan di tabel `user_roles` (bukan `user_metadata` yang dapat diubah user).
- Validasi **Zod** di server; tidak mempercayai `user_id`/`assignment_id` dari client — kepemilikan diverifikasi ulang.
- Password tidak pernah disimpan di tabel aplikasi; pembuatan akun server-side via Supabase Admin API.
- Kredensial hanya di `.env.local` (ter-`.gitignore`).

---

## 14. Kualitas Kode

Gerbang mutu sebelum merge:

```bash
npm run lint       # 0 error
npx tsc --noEmit   # tanpa error
npm run build      # sukses
```

Pola yang dijaga:
- Server Components untuk baca, Server Actions untuk tulis.
- Tipe domain eksplisit di `src/types`, skema validasi di `src/lib/validations`.
- Revalidasi path terpusat di `src/lib/revalidation.ts`.
- Komponen UI presentational; logika data di query/action.

---

## 15. Deployment

1. Build & jalankan:
   ```bash
   npm run build
   npm run start
   ```
2. Set environment variables produksi (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Terapkan migrasi ke database produksi (via `npm run db:setup` atau Supabase SQL editor).
4. Pastikan bucket Storage `bukti-pembayaran` dan policy-nya ikut dibuat (migrasi `015_proof_upload.sql`).
5. Cocok untuk Vercel atau platform Node lain.

---

## 16. Batasan & Roadmap

**Batasan saat ini**
- Pembayaran bukan payment gateway — user mencatat pembayaran, admin memverifikasi manual.
- Tabel `categories`/`expenses` masih ada di database tetapi tidak dipakai UI user.
- Upload bukti menyimpan satu file per pembayaran (tanpa versi).

**Kandidat pengembangan**
- Koreksi/penggantian setelah pembayaran ditolak.
- Notifikasi (email/in-app) saat status pembayaran berubah.
- Laporan/ekspor pembayaran.
- Halaman pengaturan admin.

---

## Lisensi

Belum ditentukan.

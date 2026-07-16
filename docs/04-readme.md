# GKMI Karunia — Dashboard Manajemen Gereja

> Aplikasi web modern untuk mengelola data jemaat, persembahan mingguan, buku kas umum (kolekte), dan manajemen akses pengurus gereja.

## 🌐 Live Demo

**[https://manage-dashboard-rose.vercel.app](https://manage-dashboard-rose.vercel.app)**

## 🏗️ Arsitektur

```
dashboard_management/
├── frontend/                 # Monorepo (React + Express)
│   ├── src/                  # React Frontend (Vite + TailwindCSS)
│   │   ├── App.tsx           # Layout utama, sidebar, routing tab
│   │   ├── LoginPage.tsx     # Halaman login
│   │   ├── DuesPage.tsx      # Pencatatan persembahan mingguan
│   │   ├── OfferingsPage.tsx # Buku kas umum (kolekte)
│   │   └── UsersPage.tsx     # Manajemen akses admin
│   ├── server/               # Express Backend (Serverless di Vercel)
│   │   ├── server.ts         # Entry point Express
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle ORM schema (4 tabel)
│   │   │   ├── index.ts      # Koneksi database
│   │   │   └── seed.ts       # Seeder akun admin
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts  # JWT authentication
│   │   └── routes/
│   │       ├── auth.ts       # POST /api/auth/login
│   │       ├── members.ts    # CRUD /api/members
│   │       ├── dues.ts       # CRUD /api/dues
│   │       ├── offerings.ts  # CRUD /api/offerings
│   │       └── users.ts      # CRUD /api/users (admin only)
│   ├── api/
│   │   └── index.ts          # Vercel Serverless Function entry
│   ├── vercel.json           # Konfigurasi rewrites Vercel
│   ├── drizzle.config.ts     # Konfigurasi Drizzle Kit
│   └── package.json
└── README.md
```

## ⚙️ Tech Stack

| Layer       | Teknologi                                       |
| ----------- | ----------------------------------------------- |
| Frontend    | React 19, Vite 8, TailwindCSS 4, Lucide Icons  |
| Backend     | Express 5 (Serverless Function di Vercel)       |
| Database    | PostgreSQL (Neon Serverless)                     |
| ORM         | Drizzle ORM + Drizzle Kit                        |
| Auth        | JWT (jsonwebtoken) + bcryptjs                    |
| Chart       | Recharts                                         |
| Hosting     | Vercel (Frontend + Serverless API)               |

## 📦 Database Schema

4 tabel utama dikelola via Drizzle ORM:

- **`users`** — Akun pengurus (email, password_hash, role)
- **`members`** — Data jemaat (nama, status)
- **`weekly_dues`** — Persembahan mingguan per-jemaat (member_id FK, minggu, tahun, nominal)
- **`offerings`** — Kas umum / kolekte (tanggal, nominal, kategori, keterangan)

## 🚀 Fitur

- **Login & Autentikasi** — JWT-based, role `admin` dan `user`
- **Manajemen Jemaat** — Tambah, edit, hapus data jemaat
- **Pencatatan Persembahan** — Input persembahan per-jemaat per-minggu, dengan grafik tren mingguan (Recharts)
- **Buku Kas Umum** — Catat pemasukan kolekte, syukuran, pembangunan, donatur, dll
- **Manajemen Akses** — Super Admin dapat membuat, mengedit email/password/role akun pengurus
- **Validasi Email** — Format email dicek sebelum pendaftaran akun
- **Anti Double-Submit** — Tombol simpan memiliki loading spinner dan disabled state
- **Responsive UI** — Sidebar collapsible untuk mobile

## 🛠️ Setup Lokal

### Prasyarat

- Node.js ≥ 18
- Database PostgreSQL (bisa pakai [Neon](https://neon.tech) gratis)

### Instalasi

```bash
# Clone repository
git clone https://github.com/farhankhuwais/manage_dashboard.git
cd manage_dashboard/frontend

# Install dependencies
npm install

# Buat file .env
cp .env.example .env
# Isi DATABASE_URL dan JWT_SECRET di .env

# Push schema ke database
npx drizzle-kit push

# Jalankan seeder (buat akun admin pertama)
npx tsx server/db/seed.ts

# Jalankan development server
npm run dev
```

### Environment Variables

| Variable       | Deskripsi                            | Contoh                                      |
| -------------- | ------------------------------------ | ------------------------------------------- |
| `DATABASE_URL` | Connection string PostgreSQL (Neon)  | `postgresql://user:pass@host/dbname?sslmode=require` |
| `JWT_SECRET`   | Secret key untuk signing JWT tokens  | `rahasia-super-aman-123`                    |

## 🌍 Deployment (Vercel)

1. Push kode ke GitHub.
2. Hubungkan repository di [Vercel Dashboard](https://vercel.com).
3. Set **Root Directory** ke `frontend`.
4. Tambahkan Environment Variables (`DATABASE_URL`, `JWT_SECRET`) di Settings → Environment Variables.
5. Deploy. Vercel akan otomatis build dan serve frontend + API serverless.

### Setup Database di Vercel

Setelah deployment pertama, kunjungi:
```
https://your-app.vercel.app/api/setup
```
Endpoint ini akan membuat semua tabel dan akun admin default (`admin@internal.com`).

## 👤 Akun Default

| Email                | Password       | Role  |
| -------------------- | -------------- | ----- |
| `admin@internal.com` | `bendahara123` | admin |

> ⚠️ **Segera ganti password default** setelah deployment pertama melalui menu Manajemen Akses.

## 📄 Lisensi

Private project — hak cipta dilindungi.

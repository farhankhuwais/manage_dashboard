# Panduan Setup & Deploy — GKMI Karunia (Vercel + Neon)

Panduan ini untuk men-deploy aplikasi ke **akun klien** memakai **Vercel** (hosting)
dan **Neon** (database PostgreSQL). Semua gratis di tier awal, cukup untuk 1 gereja.
Subdomain gratis: `namagereja.vercel.app` (domain custom opsional).

---

## Ringkasan Alur

1. Buat database di **Neon** → dapat `DATABASE_URL`
2. Deploy repo ke **Vercel** → set Environment Variables
3. Jalankan **migrasi + seed admin** sekali dari komputer (script `migrate-all.mjs`)
4. Login admin → import data jemaat → serah terima

---

## 0. Yang Perlu Disiapkan

- Akun **GitHub** (untuk connect repo ke Vercel)
- Akun **Vercel** → https://vercel.com (login pakai GitHub)
- Akun **Neon** → https://neon.tech
- **Node.js** terpasang di komputer (untuk menjalankan script migrasi) → https://nodejs.org
- Data jemaat dalam **Excel** (opsional, pakai template dari aplikasi)

---

## 1. Buat Database di Neon

1. Login ke https://neon.tech → **New Project**
2. Beri nama project (mis. `egereja`), pilih region terdekat (Singapore)
3. Setelah dibuat, buka **Connection Details / Connection string**
4. Salin **connection string** (format):
   ```
   postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
   ```
   Simpan — ini akan jadi `DATABASE_URL`.

---

## 2. Deploy ke Vercel

1. Push repo ini ke GitHub (kalau belum).
2. Di Vercel → **Add New… → Project** → pilih repo-nya.
3. **PENTING — Konfigurasi Project:**
   - **Root Directory**: `frontend`
   - Framework Preset: Vite (biasanya terdeteksi otomatis)
   - Build Command & Output: biarkan default (`npm run build`, output `dist`)
4. Buka **Environment Variables**, tambahkan 3 ini:

   | Name | Value | Keterangan |
   |------|-------|------------|
   | `DATABASE_URL` | (dari Neon, langkah 1) | Koneksi database |
   | `JWT_SECRET` | teks acak min. 32 karakter | Kunci token login (rahasia!) |
   | `SETUP_ADMIN_PASSWORD` | min. 8 karakter | Password admin pertama |

   > Cara bikin `JWT_SECRET` acak (di terminal): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

5. Klik **Deploy**. Setelah selesai, kamu dapat URL: `https://namaproject.vercel.app`

---

## 3. Inisialisasi Database (Sekali Saja)

Tabel database & akun admin dibuat lewat script dari komputer (bukan dari Vercel).

1. Di komputer, masuk folder `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Buat file `.env` di dalam `frontend` (JANGAN di-commit), isi:
   ```
   DATABASE_URL="postgresql://...dari Neon..."
   SETUP_ADMIN_PASSWORD="password-admin-min-8-karakter"
   # opsional, default admin@internal.com:
   SETUP_ADMIN_EMAIL="admin@gereja.com"
   ```
3. Jalankan migrasi:
   ```bash
   node scripts/migrate-all.mjs
   ```
   Output sukses:
   ```
   Tabel dibuat/diverifikasi: users, members, offerings, weekly_dues, attendance, service_schedules, events, follow_ups.
   Admin dibuat: admin@gereja.com (segera ganti password lewat menu Kelola Pengguna).
   Migrasi selesai. Aplikasi siap dipakai.
   ```
   > Script ini **aman dijalankan berulang** (tidak menimpa data/admin yang sudah ada).

---

## 4. Login & Serah Terima

1. Buka `https://namaproject.vercel.app`
2. Login dengan:
   - Email: `admin@gereja.com` (atau `admin@internal.com` jika tak diubah)
   - Password: nilai `SETUP_ADMIN_PASSWORD`
3. **Segera ganti password** & buat akun pengurus lain via menu **Manajemen Akses**.
4. Import data jemaat:
   - Menu **Data Jemaat → Template** (unduh Excel)
   - Isi data → **Import** → cek preview → konfirmasi
5. Selesai. Aplikasi siap dipakai.

---

## 5. Domain Custom (Opsional)

Kalau nanti mau pakai domain sendiri (mis. `gereja.com`):
1. Beli domain (Niagahoster/Cloudflare/Namecheap).
2. Di Vercel → **Project → Settings → Domains → Add** → masukkan domainnya.
3. Ikuti instruksi Vercel untuk set DNS (A/CNAME record) di penyedia domain.
4. SSL/HTTPS otomatis oleh Vercel.

---

## 6. Update Aplikasi (Nanti)

Vercel auto-deploy tiap ada push ke branch `main`:
```bash
git add -A
git commit -m "update ..."
git push origin main
```
Vercel otomatis build & deploy ulang.

Kalau ada perubahan struktur database (tabel baru), jalankan lagi:
```bash
node scripts/migrate-all.mjs
```

---

## Troubleshooting

| Masalah | Penyebab & Solusi |
|---------|-------------------|
| Login "Invalid credentials" | Admin belum di-seed → jalankan `node scripts/migrate-all.mjs`. Pastikan `DATABASE_URL` sama dengan yang di Vercel. |
| Halaman kosong / error API | Cek Environment Variables di Vercel (`DATABASE_URL`, `JWT_SECRET`) sudah benar & sudah **Redeploy** setelah menambah env. |
| `relation "..." does not exist` | Migrasi belum dijalankan → `node scripts/migrate-all.mjs`. |
| Dashboard error 500 | Tabel belum lengkap → jalankan migrasi. |
| Ganti env di Vercel tak berpengaruh | Setelah ubah env, wajib **Redeploy** project. |

---

## Catatan Keamanan

- `JWT_SECRET` harus acak & rahasia. Jangan dibagikan.
- File `.env` **jangan** di-commit (sudah ada di `.gitignore`).
- Ganti password admin default setelah login pertama.
- Semua akun (Vercel, Neon, domain) atas nama & tanggungan klien.

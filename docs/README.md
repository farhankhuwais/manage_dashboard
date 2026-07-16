# Dokumentasi GKMI Karunia — Dashboard Data Jemaat

> Semua dokumentasi proyek terkumpul di folder ini. Baca berurutan dari atas ke bawah.

---

## 📚 Daftar Isi

| No | File | Deskripsi |
|----|------|-----------|
| 01 | [01-backup-restore.md](01-backup-restore.md) | Panduan backup & restore database (Neon PITR + manual pg_dump/pg_restore) |
| 02 | [02-deploy-vercel-neon.md](02-deploy-vercel-neon.md) | Panduan lengkap deploy ke Vercel + Neon (Neon DB → Vercel deploy → migrasi → login → import data) |
| 03 | [03-summary.md](03-summary.md) | Ringkasan arsitektur, fitur utama, decision log, cara lanjut sesi baru |
| 04 | [04-readme.md](04-readme.md) | README utama proyek (ringkasan struktur & cara kerja) |
| 05 | [05-frontend-readme.md](05-frontend-readme.md) | README spesifik frontend (Vite + React + Tailwind) |

---

## 🚀 Quick Start (Deploy Produksi)

> Jalur tercepat: **Vercel + Neon** (free tier, tanpa VPS)

```
1. Klien buat akun Neon → dapatkan DATABASE_URL
2. Klien buat repo GitHub + invite kamu sebagai collaborator
3. Deploy ke Vercel (Root Dir: frontend) + set 3 env var
4. Jalankan migrasi: node scripts/migrate-all.mjs
5. Login admin → import data jemaat → selesai
```

Detail lengkap: lihat [02-deploy-vercel-neon.md](02-deploy-vercel-neon.md)

---

## 📦 Scripts Siap Pakai

| Script | Lokasi | Fungsi |
|--------|--------|--------|
| `migrate-all.mjs` | `frontend/scripts/` | Buat SEMUA tabel + seed admin (idempoten) |
| `backup-db.mjs` | `frontend/scripts/` | Dump database ke `backups/` (butuh pg_dump) |
| `migrate-dashboard.mjs` | `frontend/scripts/` | Hanya tabel dashboard (attendance, schedules, events, follow_ups) |

Jalankan dari folder `frontend/`:
```bash
node scripts/migrate-all.mjs
node scripts/backup-db.mjs
```

---

## 🔐 Environment Variables (Production)

| Variable | Contoh | Wajib |
|----------|--------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | ✅ |
| `JWT_SECRET` | `a1b2c3...` (min 32 char, random) | ✅ |
| `SETUP_ADMIN_PASSWORD` | `password123` (min 8 char) | ✅ |
| `SETUP_ADMIN_EMAIL` | `admin@gereja.com` | ❌ (default: admin@internal.com) |

> Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 📁 Struktur Proyek (Ringkas)

```
dashboard_management/
├── docs/                    # ← Dokumentasi ini
├── frontend/
│   ├── src/                 # React + Vite + Tailwind
│   ├── server/              # Express + Drizzle ORM
│   │   ├── routes/          # API endpoints
│   │   ├── db/              # Drizzle schema & migrasi
│   │   └── middleware/      # Auth JWT
│   ├── scripts/             # Migrasi & backup
│   ├── scripts/migrate-all.mjs
│   ├── scripts/backup-db.mjs
│   ├── DEPLOY.md
│   ├── BACKUP.md
│   └── package.json
├── SUMMARY.md               # Ringkasan proyek
├── README.md
└── .gitignore
```

---

## 🔧 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, XLSX, jsPDF
- **Backend**: Express 5, Drizzle ORM, PostgreSQL (Neon), JWT (bcryptjs)
- **Deploy**: Vercel (frontend + API) + Neon (PostgreSQL managed)
- **Auth**: JWT + bcrypt, role-based (admin/user)

---

## 📞 Support / Lanjutkan

- Semua dokumentasi ada di folder `docs/`
- Untuk lanjut sesi baru: bilang "lanjutkan project dashboard, baca git log & SUMMARY.md"
- Script migrasi & backup sudah siap pakai

---

> **Catatan**: Semua file di `docs/` adalah salinan dari file asli di `frontend/` dan root. File asli tetap di lokasi asalnya untuk keperluan development.
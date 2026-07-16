# SUMMARY — Dashboard Management (GKJ Jemaat)

Project: Web dashboard manajemen data jemaat GKJ.
Stack: React + Vite (frontend), Hapi.js (backend `src/`), MySQL (libsql/jemaat table).
Default branch: `main`. Semua perubahan di-commit & push ke `main`.

## Struktur Utama
- `frontend/src/App.tsx` — halaman utama (daftar jemaat, form tambah/edit, filter, import/export). File paling sering diubah.
- `frontend/src/DuesPage.tsx` — halaman iuran.
- `frontend/src/UsersPage.tsx` — halaman user.
- `frontend/src/OfferingsPage.tsx` — halaman persembahan.
- `src/index.ts` (Hapi) — endpoint API `/api/members` (GET/POST/PUT) + `/api/members/import` (upsert by name).
- `src/db.ts` — koneksi MySQL via `mysql2/promise`.

## Fitur Jemaat (App.tsx)
- Tabel anggota dengan kolom: Nama, Status, No Urut, Status Anggota, Status Warga, Status Keluarga, Komisi, Tempat/Tgl Lahir, JK, Pekerjaan, Pendidikan, No Telp, Alamat, Asal Gereja.
- Status badge warna: Aktif=emerald, Pindah=amber, Tidak Aktif=slate, lainnya=rose.
- Tambah/Edit via drawer form (validasi: nama wajib, no urut numerik opsional).
- Filter: search teks + dropdown Status + dropdown Komisi.
- Export Excel (XLSX) dan PDF (jsPDF autoTable).
- Download template import (XLSX).
- Import dari Excel → modal preview dengan toggle "Upsert berdasarkan Nama" di dalam modal.

## Keputusan / State Penting
- STATUS_OPTIONS = `['Aktif', 'Tidak Aktif', 'Pindah']` (TIDAK ada opsi "Meninggal" — sudah direvert).
- Nilai status di DB/form = `"Tidak Aktif"` (bukan "Non-Aktif"). Filter & badge pakai string persis ini. Hindari typo "Non-Aktif".
- Toggle "Upsert by Nama" HANYA ada di dalam modal preview import (dihapus dari header).
- Tombol toolbar urutan: Template → Import → Excel → PDF.
- Import endpoint: `POST /api/members/import` body `{ upsert: boolean, data: [...] }`.

## Riwayat Commit Terkait (main)
- `a0e8055` UI: pindah tombol Import ke samping Excel, hapus checkbox Upsert by Nama di header
- `5704843` revert: hapus opsi Meninggal dari filter status
- `c35e8ad` fix: status filter "Tidak Aktif" (typo "Non-Aktif")
- `1fab05e` init: UI filter status (3 opsi) + Upsert di modal

## Update: Fitur Dashboard "Beranda" (pusat informasi)

Catatan stack aktual (koreksi): backend jalan dari `frontend/server/` (Express + Drizzle ORM + PostgreSQL via `pg`), bukan Hapi/MySQL. Deploy Vercel lewat `frontend/api/index.ts` yang re-export express app. `vercel.json` rewrite `/api/*` → `/api/index`.

### Tabel DB baru (`frontend/server/db/schema.ts`)
- `attendance` (service_date, session, headcount, note)
- `service_schedules` (service_date, team_name, detail, person_count)
- `events` (title, event_date, time, location, description)
- `follow_ups` (title, description, category, people, status default 'Belum', due_date)

Auto-migrasi idempoten: `ensureDashboardTables()` di `frontend/server/db/index.ts`, dipanggil cold-start di `server.ts`. Script manual: `node frontend/scripts/migrate-dashboard.mjs`.

### Backend routes (mounted di `server.ts`, semua `authenticateToken`)
- `/api/dashboard` (GET aggregate: kpi, trenKehadiran 6 minggu, demografi umur, rincianPersembahan, timBertugas, agenda, followUps)
- `/api/attendance`, `/api/schedules`, `/api/events`, `/api/follow-ups` (CRUD penuh)

### Frontend
- Pages baru: `DashboardPage.tsx` (read-only overview), `AttendancePage.tsx`, `SchedulesPage.tsx`, `EventsPage.tsx`, `FollowUpsPage.tsx`.
- `src/lib/format.ts` (formatRupiah/Short, formatDate/Short), `src/Dashboard.css` (palet liturgis gold/sage/wine, heading Fraunces).
- `App.tsx`: tab default `dashboard` (Beranda). Nav: Beranda, Data Jemaat, Kehadiran Ibadah, Jadwal Pelayanan, Agenda Kegiatan, Tindak Lanjut, Persembahan, Buku Kas Umum, Manajemen Akses (admin).
- Inline `OverviewPage` (breakdown per-field) DIHAPUS, diganti Beranda. Demografi ringkas ada di Beranda.
- `index.html`: Google Fonts Fraunces + Inter.

### Referensi desain
`d:\belajar\tools\Hasil\dashboard_gereja.html` (prototipe HTML statis, sumber palet & layout).

### Verifikasi
- `cd frontend; npx tsc -b --noEmit` → exit 0.
- Migrasi tabel dashboard sudah dijalankan ke DB (created/verified).

### TODO belum dikerjakan / catatan
- KPI card di DashboardPage punya prop `tab` tapi kartu belum clickable (navigasi hanya via tombol "Kelola" per-section).
- SUMMARY.md bagian atas (Stack: Hapi/MySQL) masih deskripsi lama — abaikan, pakai catatan koreksi di atas.

## Cara Lanjut Sesi Baru
Mulai chat di folder ini, bilang: "lanjutkan project dashboard, baca git log & SUMMARY.md".
Gunakan Context7 bila perlu update library (react, xlsx, jspdf, express, drizzle).

# Panduan Backup & Restore Database — E-Gereja (PostgreSQL / Neon)

Dokumen ini menjelaskan cara membackup dan memulihkan (restore) database aplikasi.
Ada 2 lapis pengamanan:

1. **Backup otomatis Neon** (bawaan platform) — tanpa effort.
2. **Backup manual** (`pg_dump`) — file `.sql` yang bisa kamu simpan sendiri.

> `DATABASE_URL` = connection string dari Neon, format:
> `postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require`

---

## 1. Backup Otomatis (Neon) — Rekomendasi Utama

Neon otomatis menyimpan riwayat perubahan sehingga bisa "putar balik waktu".

### Point-in-Time Restore (PITR)
- Neon menyimpan history (retensi tergantung plan; Free tier biasanya **1 hari**, plan berbayar lebih lama).
- Untuk restore ke waktu tertentu:
  1. Login https://console.neon.tech → pilih project.
  2. Menu **Branches** → **Restore** (atau **Time Travel / History**).
  3. Pilih titik waktu (tanggal/jam) sebelum masalah terjadi.
  4. Neon membuat cabang (branch) dari titik itu, atau me-restore branch utama.

### Branch sebagai snapshot manual
Sebelum melakukan perubahan besar (mis. import massal), buat cabang sebagai "titik simpan":
1. Neon Console → **Branches → New Branch** (mis. nama `sebelum-import-2026-07`).
2. Kalau terjadi masalah, kamu bisa kembali/promote cabang tersebut.

> **Catatan:** Untuk retensi lebih panjang (mingguan/bulanan), tetap lakukan **backup manual** di bawah.

---

## 2. Backup Manual dengan `pg_dump`

Menghasilkan 1 file `.sql` berisi seluruh isi database. Simpan di komputer/drive/cloud.

### Prasyarat
Install **PostgreSQL client tools** (menyediakan `pg_dump` & `pg_restore`/`psql`):
- Windows: https://www.postgresql.org/download/windows/ (saat install, cukup pilih *Command Line Tools*)
- macOS: `brew install libpq` lalu `brew link --force libpq`
- Linux (Ubuntu): `sudo apt install postgresql-client`

Cek terpasang:
```bash
pg_dump --version
```

### Backup (buat file .sql)
```bash
pg_dump "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -Fp -f backup-egereja-2026-07-15.sql
```
- `-Fp` = format plain SQL (mudah dibaca & portable)
- Ganti nama file dengan tanggal biar rapi.

Alternatif format terkompresi (lebih kecil, restore pakai `pg_restore`):
```bash
pg_dump "DATABASE_URL" -Fc -f backup-egereja-2026-07-15.dump
```

### Backup hanya data (tanpa struktur) atau sebaliknya
```bash
pg_dump "DATABASE_URL" --data-only -Fp -f data-only.sql       # data saja
pg_dump "DATABASE_URL" --schema-only -Fp -f schema-only.sql   # struktur saja
```

---

## 3. Restore (Memulihkan Database)

> **PERINGATAN:** Restore menimpa data. Untuk keamanan, restore ke **database/branch baru** dulu,
> pastikan benar, baru arahkan aplikasi ke sana.

### Dari file plain `.sql`
```bash
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -f backup-egereja-2026-07-15.sql
```

### Dari file `.dump` (format -Fc)
```bash
pg_restore --clean --if-exists --no-owner -d "DATABASE_URL" backup-egereja-2026-07-15.dump
```
- `--clean --if-exists` = hapus objek lama sebelum restore (hati-hati).
- `--no-owner` = abaikan kepemilikan (cocok lintas akun/Neon).

### Restore aman ke branch baru (Neon)
1. Buat branch baru di Neon → dapat `DATABASE_URL` branch tersebut.
2. Restore ke branch itu (pakai perintah di atas dengan URL branch).
3. Verifikasi data → kalau OK, promote/pakai branch tersebut.

---

## 4. Jadwal Backup yang Disarankan

| Frekuensi | Cara | Simpan di |
|-----------|------|-----------|
| Harian | Neon PITR (otomatis) | Neon |
| Mingguan | `pg_dump` manual | Google Drive / hard disk |
| Sebelum import massal | Neon branch snapshot | Neon |
| Bulanan (arsip) | `pg_dump` + simpan permanen | Cloud storage |

---

## 5. Backup Cepat via Script (opsional)

Tersedia script bantu: `scripts/backup-db.mjs` (butuh `pg_dump` terpasang & `.env` berisi `DATABASE_URL`).

```bash
cd frontend
node scripts/backup-db.mjs
```
Menghasilkan file `backups/backup-egereja-<tanggal>.sql` otomatis dengan nama bertanggal.

---

## 6. Tips & Keamanan

- **Simpan file backup di tempat aman** (bukan di repo/GitHub). Folder `backups/` sudah diabaikan git.
- File backup berisi data pribadi jemaat → perlakukan sebagai **rahasia**.
- Jangan pernah commit `.sql`/`.dump` atau `.env` ke Git.
- Uji restore secara berkala ke branch/DB terpisah agar yakin backup benar-benar bisa dipulihkan.
- Untuk klien: jelaskan bahwa Neon Free tier retensi PITR terbatas — backup manual mingguan tetap penting.

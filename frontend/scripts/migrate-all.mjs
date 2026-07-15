// Migrasi lengkap untuk deploy baru (Neon/PostgreSQL).
// Membuat SEMUA tabel yang dibutuhkan aplikasi + seed akun admin pertama.
// Idempoten: aman dijalankan berulang (CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING).
//
// Jalankan sekali dari komputer lokal (bukan di Vercel):
//   1. Isi .env: DATABASE_URL, SETUP_ADMIN_PASSWORD (min 8), opsional SETUP_ADMIN_EMAIL
//   2. node scripts/migrate-all.mjs
//
// Catatan: /api/setup diblokir di production, jadi seed admin dilakukan lewat script ini.

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/dashboard",
});

// Semua kolom lengkap tabel members (sinkron dengan schema.ts)
const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "email" text NOT NULL UNIQUE,
    "password_hash" text NOT NULL,
    "role" text NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "members" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "status" text NOT NULL,
    "status_anggota" text,
    "status_warga" text,
    "status_keluarga" text,
    "no_urut" integer,
    "status_posisi" text,
    "komisi" text,
    "tempat_lahir" text,
    "tanggal_lahir" date,
    "jenis_kelamin" text,
    "warga_negara" text,
    "status_pernikahan" text,
    "tanggal_nikah" date,
    "golongan_darah" text,
    "nik" text,
    "alamat_domisili" text,
    "kota" text,
    "no_telp" text,
    "pekerjaan" text,
    "pendidikan_terakhir" text,
    "penyerahan_anak" text,
    "penyerahan_anak_tgl" date,
    "baptis_sidi" text,
    "baptis_sidi_tgl" date,
    "atestasi" text,
    "atestasi_tgl" date,
    "asal_gereja" text
  );

  CREATE TABLE IF NOT EXISTS "offerings" (
    "id" serial PRIMARY KEY NOT NULL,
    "date" timestamp DEFAULT now() NOT NULL,
    "amount" integer NOT NULL,
    "category" text NOT NULL,
    "description" text
  );

  CREATE TABLE IF NOT EXISTS "weekly_dues" (
    "id" serial PRIMARY KEY NOT NULL,
    "member_id" integer REFERENCES members(id),
    "week_number" integer NOT NULL,
    "year" integer NOT NULL,
    "amount" integer NOT NULL,
    "date" timestamp DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "attendance" (
    "id" serial PRIMARY KEY NOT NULL,
    "service_date" date NOT NULL,
    "session" text NOT NULL,
    "headcount" integer NOT NULL,
    "note" text
  );

  CREATE TABLE IF NOT EXISTS "service_schedules" (
    "id" serial PRIMARY KEY NOT NULL,
    "service_date" date NOT NULL,
    "team_name" text NOT NULL,
    "detail" text,
    "person_count" integer NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS "events" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "event_date" date NOT NULL,
    "time" text,
    "location" text,
    "description" text
  );

  CREATE TABLE IF NOT EXISTS "follow_ups" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "category" text,
    "people" text,
    "status" text NOT NULL DEFAULT 'Belum',
    "due_date" date
  );

  -- Jaga-jaga untuk DB lama/partial: pastikan kolom penting ada.
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text;
`;

const main = async () => {
  const email = (process.env.SETUP_ADMIN_EMAIL || "admin@internal.com").trim();
  const password = process.env.SETUP_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    console.error(
      "GAGAL: SETUP_ADMIN_PASSWORD (min. 8 karakter) wajib di-set di .env untuk seed admin."
    );
    process.exit(1);
  }

  // 1. Buat semua tabel
  await pool.query(SCHEMA_SQL);
  console.log("Tabel dibuat/diverifikasi: users, members, offerings, weekly_dues, attendance, service_schedules, events, follow_ups.");

  // 2. Seed admin (idempoten — tidak menimpa admin yang sudah ada)
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO "users" ("email", "password_hash", "role")
     VALUES ($1, $2, 'admin')
     ON CONFLICT ("email") DO NOTHING
     RETURNING id;`,
    [email, passwordHash]
  );

  if (result.rowCount > 0) {
    console.log(`Admin dibuat: ${email} (segera ganti password lewat menu Kelola Pengguna).`);
  } else {
    console.log(`Admin ${email} sudah ada — dilewati (password tidak diubah).`);
  }

  await pool.end();
  console.log("Migrasi selesai. Aplikasi siap dipakai.");
};

main().catch((err) => {
  console.error("Migrasi gagal:", err?.message || err);
  process.exit(1);
});

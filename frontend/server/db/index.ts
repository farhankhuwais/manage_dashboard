import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/dashboard"
});

export const db = drizzle(pool, { schema });

// Auto-migrasi kolom `members` yg ditambahkan (idempoten, aman dijalankan berulang).
// Dijalankan di environment deployment (Vercel) yg terhubung ke DB production,
// sehingga kolom kebuat di DB yg benar tanpa perlu akses DB secara manual.
const MEMBER_COLUMNS: [string, string][] = [
  ["no_urut", "integer"],
  ["status_anggota", "text"],
  ["status_warga", "text"],
  ["status_keluarga", "text"],
  ["status_posisi", "text"],
  ["komisi", "text"],
  ["tempat_lahir", "text"],
  ["tanggal_lahir", "date"],
  ["jenis_kelamin", "text"],
  ["warga_negara", "text"],
  ["status_pernikahan", "text"],
  ["tanggal_nikah", "date"],
  ["golongan_darah", "text"],
  ["nik", "text"],
  ["alamat_domisili", "text"],
  ["kota", "text"],
  ["no_telp", "text"],
  ["pekerjaan", "text"],
  ["pendidikan_terakhir", "text"],
  ["penyerahan_anak", "text"],
  ["penyerahan_anak_tgl", "date"],
  ["baptis_sidi", "text"],
  ["baptis_sidi_tgl", "date"],
  ["atestasi", "text"],
  ["atestasi_tgl", "date"],
  ["asal_gereja", "text"],
];

let ensureMembersColumnsPromise: Promise<void> | null = null;
export function ensureMembersColumns(): Promise<void> {
  if (!ensureMembersColumnsPromise) {
    ensureMembersColumnsPromise = (async () => {
      for (const [col, type] of MEMBER_COLUMNS) {
        await pool.query(
          `ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "${col}" ${type};`
        );
      }
    })().catch((err) => {
      // reset agar bisa dicoba lagi pada request berikutnya
      ensureMembersColumnsPromise = null;
      throw err;
    });
  }
  return ensureMembersColumnsPromise;
}

// Auto-migrasi tabel dashboard (attendance, service_schedules, events,
// follow_ups) — idempoten, dijalankan di cold-start Vercel.
const DASHBOARD_TABLES_SQL = `
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
`;

let ensureDashboardTablesPromise: Promise<void> | null = null;
export function ensureDashboardTables(): Promise<void> {
  if (!ensureDashboardTablesPromise) {
    ensureDashboardTablesPromise = pool
      .query(DASHBOARD_TABLES_SQL)
      .then(() => undefined)
      .catch((err) => {
        ensureDashboardTablesPromise = null;
        throw err;
      });
  }
  return ensureDashboardTablesPromise;
}

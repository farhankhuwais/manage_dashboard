import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/dashboard",
});

const SQL = `
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

const main = async () => {
  await pool.query(SQL);
  console.log("Dashboard tables (attendance, service_schedules, events, follow_ups) created/verified.");
  await pool.end();
};

main().catch((err) => {
  console.error("Migrasi gagal:", err?.message || err);
  process.exit(1);
});

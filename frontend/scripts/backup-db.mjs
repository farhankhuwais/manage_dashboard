// Backup database ke file .sql bertanggal menggunakan pg_dump.
// Prasyarat: pg_dump terpasang (PostgreSQL client tools) & .env berisi DATABASE_URL.
//
// Jalankan:
//   cd frontend
//   node scripts/backup-db.mjs
//
// Output: backups/backup-egereja-YYYY-MM-DD-HHmm.sql

import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("GAGAL: DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

const dir = join(process.cwd(), "backups");
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
const outFile = join(dir, `backup-egereja-${stamp}.sql`);

console.log("Membuat backup...");
console.log("Output:", outFile);

const child = spawn("pg_dump", [url, "-Fp", "-f", outFile], { stdio: ["ignore", "inherit", "inherit"] });

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error("\nGAGAL: 'pg_dump' tidak ditemukan.");
    console.error("Install PostgreSQL client tools dulu. Lihat BACKUP.md bagian 2.");
  } else {
    console.error("GAGAL menjalankan pg_dump:", err.message);
  }
  process.exit(1);
});

child.on("close", (code) => {
  if (code === 0) {
    console.log("\nBackup selesai:", outFile);
  } else {
    console.error(`\npg_dump keluar dengan kode ${code}. Backup mungkin gagal.`);
    process.exit(code ?? 1);
  }
});

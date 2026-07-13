import express from "express";
import { sql } from "drizzle-orm";
import authRoutes from "./routes/auth.js";
import membersRoutes from "./routes/members.js";
import duesRoutes from "./routes/dues.js";
import usersRoutes from "./routes/users.js";
import offeringsRoutes from "./routes/offerings.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/api/setup", async (req, res) => {
  // Endpoint darurat — hanya izinkan di luar production agar tidak bisa
  // disalahgunakan untuk reset akun admin di deployment live.
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Setup tidak diizinkan di environment production" });
  }
  try {
    const { db } = require("./db/index.js");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" text NOT NULL
      );
      CREATE TABLE IF NOT EXISTS "members" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "status" text NOT NULL
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
    `);

    // Seed admin — password di-parameterize (cegah SQL injection).
    // Password WAJIB dari env SETUP_ADMIN_PASSWORD; tanpa itu, tolak seed
    // agar tidak ada kredensial default yang ter-hardcode.
    const bcrypt = require("bcryptjs");
    const setupPassword = process.env.SETUP_ADMIN_PASSWORD;
    if (!setupPassword || setupPassword.length < 8) {
      return res.status(400).json({ error: "SETUP_ADMIN_PASSWORD (min. 8 karakter) wajib di-set di environment untuk seed admin" });
    }
    const passwordHash = await bcrypt.hash(setupPassword, 10);
    await db.execute(
      sql`INSERT INTO "users" ("email", "password_hash", "role")
          VALUES ('admin@internal.com', ${passwordHash}, 'admin')
          ON CONFLICT ("email") DO NOTHING;`
    );

    res.json({ status: "SUCCESS", message: "Database tables and admin user created successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message, cause: err.cause?.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/members", authenticateToken, membersRoutes);
app.use("/api/dues", authenticateToken, duesRoutes);
app.use("/api/users", authenticateToken, usersRoutes);
app.use("/api/offerings", authenticateToken, offeringsRoutes);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

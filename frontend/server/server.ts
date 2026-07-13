import express from "express";
import authRoutes from "./routes/auth";
import membersRoutes from "./routes/members";
import duesRoutes from "./routes/dues";
import usersRoutes from "./routes/users";
import { authenticateToken } from "./middleware/authMiddleware";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/api/setup", async (req, res) => {
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
    
    // Seed admin
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash("bendahara123", 10);
    await db.execute(`
      INSERT INTO "users" ("email", "password_hash", "role") 
      VALUES ('admin@internal.com', '${passwordHash}', 'admin')
      ON CONFLICT ("email") DO NOTHING;
    `);
    
    res.json({ status: "SUCCESS", message: "Database tables and admin user created successfully!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message, cause: err.cause?.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/members", authenticateToken, membersRoutes);
app.use("/api/dues", authenticateToken, duesRoutes);
app.use("/api/users", authenticateToken, usersRoutes);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

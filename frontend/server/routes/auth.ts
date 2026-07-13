import { Router } from "express";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

const router = Router();

// Pendaftaran akun hanya lewat /api/users (admin). Tidak ada endpoint publik.
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await db.select().from(users).where(eq(users.email, email));
    if (userResult.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult[0]!;
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: "Server error: " + (error?.cause?.message || error?.message || String(error)) });
  }
});

export default router;

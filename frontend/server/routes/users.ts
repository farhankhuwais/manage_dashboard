import { Router } from "express";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// Middleware tambahan untuk proteksi rute khusus Admin
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Akses ditolak. Hanya Admin yang dapat mengakses." });
  }
  next();
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ["admin", "bendahara"];

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/users - List semua akun pengurus
router.get("/", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
    }).from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil daftar pengguna" });
  }
});

// POST /api/users - Tambah akun baru
router.post("/", requireAdmin, async (req: AuthRequest, res) => {
  const { email, password, role } = req.body;

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) ||
      typeof password !== "string" || password.length < 8 ||
      typeof role !== "string" || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Email valid, password min. 8 karakter, dan role (admin/bendahara) wajib diisi" });
  }

  try {
    const existing = await db.select().from(users).where(eq(users.email, email.trim()));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.insert(users).values({ email: email.trim(), passwordHash, role });
    res.status(201).json({ message: "Akun pengurus berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan akun" });
  }
});

// PUT /api/users/:id - Edit akun pengurus
router.put("/:id", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseId(Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID pengguna tidak valid" });
  }
  const { email, password, role } = req.body;

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) ||
      typeof role !== "string" || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Email valid dan role (admin/bendahara) tidak boleh kosong" });
  }

  try {
    const existing = await db.select().from(users).where(eq(users.email, email.trim()));
    if (existing.length > 0 && existing[0]!.id !== id) {
      return res.status(400).json({ error: "Email sudah digunakan oleh akun lain" });
    }

    const updateData: any = { email: email.trim(), role };

    if (typeof password === "string" && password.trim() !== '') {
      if (password.length < 8) {
        return res.status(400).json({ error: "Password minimal 8 karakter" });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updated = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }
    res.json({ message: "Akun pengurus berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui akun" });
  }
});

export default router;

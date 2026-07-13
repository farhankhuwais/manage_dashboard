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
  
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.insert(users).values({ email, passwordHash, role });
    res.status(201).json({ message: "Akun pengurus berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan akun" });
  }
});

// PUT /api/users/:id - Edit akun pengurus
router.put("/:id", requireAdmin, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { email, password, role } = req.body;
  
  if (!email || !role) {
    return res.status(400).json({ error: "Email dan role tidak boleh kosong" });
  }

  try {
    // Cek apakah email sudah dipakai oleh user lain
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0 && existing[0]!.id !== Number(id)) {
      return res.status(400).json({ error: "Email sudah digunakan oleh akun lain" });
    }

    const updateData: any = { email, role };

    // Jika password diisi, hash password baru
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    await db.update(users).set(updateData).where(eq(users.id, Number(id)));
    res.json({ message: "Akun pengurus berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui akun" });
  }
});

export default router;

import { Router } from "express";
import { db } from "../db/index";
import { offerings } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/offerings - List semua kas umum
router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(offerings).orderBy(desc(offerings.date));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data buku kas umum" });
  }
});

// POST /api/offerings - Tambah kas umum
router.post("/", async (req, res) => {
  const { amount, category, description } = req.body;
  if (!amount || !category) {
    return res.status(400).json({ error: "Kategori dan Nominal wajib diisi" });
  }

  try {
    await db.insert(offerings).values({ amount, category, description });
    res.status(201).json({ message: "Data kas berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan data kas" });
  }
});

// PUT /api/offerings/:id - Update kas umum
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { amount, category, description } = req.body;
  
  if (!amount || !category) {
    return res.status(400).json({ error: "Kategori dan Nominal wajib diisi" });
  }

  try {
    await db.update(offerings).set({ amount, category, description }).where(eq(offerings.id, parseInt(id)));
    res.json({ message: "Data kas berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui data kas" });
  }
});

// DELETE /api/offerings/:id - Hapus kas umum
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(offerings).where(eq(offerings.id, parseInt(id)));
    res.json({ message: "Data kas berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus data kas" });
  }
});

export default router;

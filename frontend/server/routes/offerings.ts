import { Router } from "express";
import { db } from "../db/index";
import { offerings } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

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
  const amount = Number(req.body.amount);
  const { category, description } = req.body;
  if (!Number.isInteger(amount) || amount <= 0 || typeof category !== "string" || !category.trim()) {
    return res.status(400).json({ error: "Kategori dan Nominal (positif) wajib diisi" });
  }

  try {
    await db.insert(offerings).values({ amount, category: category.trim(), description });
    res.status(201).json({ message: "Data kas berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan data kas" });
  }
});

// PUT /api/offerings/:id - Update kas umum
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID kas tidak valid" });
  }
  const amount = Number(req.body.amount);
  const { category, description } = req.body;

  if (!Number.isInteger(amount) || amount <= 0 || typeof category !== "string" || !category.trim()) {
    return res.status(400).json({ error: "Kategori dan Nominal (positif) wajib diisi" });
  }

  try {
    const updated = await db
      .update(offerings)
      .set({ amount, category: category.trim(), description })
      .where(eq(offerings.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Data kas tidak ditemukan" });
    }
    res.json({ message: "Data kas berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui data kas" });
  }
});

// DELETE /api/offerings/:id - Hapus kas umum
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID kas tidak valid" });
  }
  try {
    const deleted = await db.delete(offerings).where(eq(offerings.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Data kas tidak ditemukan" });
    }
    res.json({ message: "Data kas berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus data kas" });
  }
});

export default router;

import { Router } from "express";
import { db } from "../db/index";
import { members } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(members);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data jemaat" });
  }
});

router.post("/", async (req, res) => {
  const { name, status } = req.body;
  if (typeof name !== "string" || !name.trim() || typeof status !== "string" || !status.trim()) {
    return res.status(400).json({ error: "Nama dan status wajib diisi" });
  }

  try {
    await db.insert(members).values({ name: name.trim(), status: status.trim() });
    res.status(201).json({ message: "Jemaat ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan jemaat" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID jemaat tidak valid" });
  }
  try {
    const deleted = await db.delete(members).where(eq(members.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Jemaat tidak ditemukan" });
    }
    res.json({ message: "Jemaat berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus data jemaat" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID jemaat tidak valid" });
  }
  const { name, status } = req.body;
  if (typeof name !== "string" || !name.trim() || typeof status !== "string" || !status.trim()) {
    return res.status(400).json({ error: "Nama dan status wajib diisi" });
  }

  try {
    const updated = await db
      .update(members)
      .set({ name: name.trim(), status: status.trim() })
      .where(eq(members.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Jemaat tidak ditemukan" });
    }
    res.json({ message: "Jemaat berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui jemaat" });
  }
});

export default router;

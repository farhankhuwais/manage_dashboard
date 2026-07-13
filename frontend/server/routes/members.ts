import { Router } from "express";
import { db } from "../db/index.js";
import { members } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

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
  if (!name || !status) {
    return res.status(400).json({ error: "Nama dan status wajib diisi" });
  }

  try {
    await db.insert(members).values({ name, status });
    res.status(201).json({ message: "Jemaat ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan jemaat" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(members).where(eq(members.id, parseInt(id)));
    res.json({ message: "Jemaat berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus data jemaat" });
  }
});

export default router;

import { Router } from "express";
import { db } from "../db/index";
import { followUps } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(followUps).orderBy(desc(followUps.dueDate));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Gagal mengambil tindak lanjut" });
  }
});

router.post("/", async (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : null;
  const category = typeof req.body.category === "string" ? req.body.category.trim() : null;
  const people = typeof req.body.people === "string" ? req.body.people.trim() : null;
  const status = typeof req.body.status === "string" && req.body.status.trim() ? req.body.status.trim() : "Belum";
  const dueDate = typeof req.body.dueDate === "string" && req.body.dueDate ? req.body.dueDate : null;
  if (!title) {
    return res.status(400).json({ error: "Nama tindak lanjut wajib diisi" });
  }
  try {
    await db.insert(followUps).values({ title, description, category, people, status, dueDate });
    res.status(201).json({ message: "Tindak lanjut ditambahkan" });
  } catch {
    res.status(500).json({ error: "Gagal menambah tindak lanjut" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : null;
  const category = typeof req.body.category === "string" ? req.body.category.trim() : null;
  const people = typeof req.body.people === "string" ? req.body.people.trim() : null;
  const status = typeof req.body.status === "string" && req.body.status.trim() ? req.body.status.trim() : "Belum";
  const dueDate = typeof req.body.dueDate === "string" && req.body.dueDate ? req.body.dueDate : null;
  if (!title) {
    return res.status(400).json({ error: "Nama tindak lanjut wajib diisi" });
  }
  try {
    const updated = await db
      .update(followUps)
      .set({ title, description, category, people, status, dueDate })
      .where(eq(followUps.id, id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Tindak lanjut diperbarui" });
  } catch {
    res.status(500).json({ error: "Gagal memperbarui tindak lanjut" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  try {
    const deleted = await db.delete(followUps).where(eq(followUps.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Tindak lanjut dihapus" });
  } catch {
    res.status(500).json({ error: "Gagal menghapus tindak lanjut" });
  }
});

export default router;

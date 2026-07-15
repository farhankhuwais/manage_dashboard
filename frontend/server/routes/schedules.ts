import { Router } from "express";
import { db } from "../db/index";
import { serviceSchedules } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(serviceSchedules).orderBy(desc(serviceSchedules.serviceDate));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Gagal mengambil jadwal pelayanan" });
  }
});

router.post("/", async (req, res) => {
  const serviceDate = typeof req.body.serviceDate === "string" && req.body.serviceDate ? req.body.serviceDate : null;
  const teamName = typeof req.body.teamName === "string" ? req.body.teamName.trim() : "";
  const detail = typeof req.body.detail === "string" ? req.body.detail.trim() : null;
  const personCount = Number(req.body.personCount);
  if (!serviceDate || !teamName || !Number.isInteger(personCount) || personCount < 0) {
    return res.status(400).json({ error: "Tanggal, nama tim, dan jumlah personil wajib diisi" });
  }
  try {
    await db.insert(serviceSchedules).values({ serviceDate, teamName, detail, personCount });
    res.status(201).json({ message: "Jadwal pelayanan ditambahkan" });
  } catch {
    res.status(500).json({ error: "Gagal menambah jadwal pelayanan" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  const serviceDate = typeof req.body.serviceDate === "string" && req.body.serviceDate ? req.body.serviceDate : null;
  const teamName = typeof req.body.teamName === "string" ? req.body.teamName.trim() : "";
  const detail = typeof req.body.detail === "string" ? req.body.detail.trim() : null;
  const personCount = Number(req.body.personCount);
  if (!serviceDate || !teamName || !Number.isInteger(personCount) || personCount < 0) {
    return res.status(400).json({ error: "Tanggal, nama tim, dan jumlah personil wajib diisi" });
  }
  try {
    const updated = await db
      .update(serviceSchedules)
      .set({ serviceDate, teamName, detail, personCount })
      .where(eq(serviceSchedules.id, id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Jadwal pelayanan diperbarui" });
  } catch {
    res.status(500).json({ error: "Gagal memperbarui jadwal pelayanan" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  try {
    const deleted = await db.delete(serviceSchedules).where(eq(serviceSchedules.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Jadwal pelayanan dihapus" });
  } catch {
    res.status(500).json({ error: "Gagal menghapus jadwal pelayanan" });
  }
});

export default router;

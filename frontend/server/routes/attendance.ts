import { Router } from "express";
import { db } from "../db/index";
import { attendance } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(attendance).orderBy(desc(attendance.serviceDate));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Gagal mengambil data kehadiran" });
  }
});

router.post("/", async (req, res) => {
  const serviceDate = typeof req.body.serviceDate === "string" && req.body.serviceDate ? req.body.serviceDate : null;
  const session = typeof req.body.session === "string" ? req.body.session.trim() : "";
  const headcount = Number(req.body.headcount);
  const note = typeof req.body.note === "string" ? req.body.note.trim() : null;
  if (!serviceDate || !session || !Number.isInteger(headcount) || headcount < 0) {
    return res.status(400).json({ error: "Tanggal, sesi, dan jumlah hadir wajib diisi" });
  }
  try {
    await db.insert(attendance).values({ serviceDate, session, headcount, note });
    res.status(201).json({ message: "Data kehadiran ditambahkan" });
  } catch {
    res.status(500).json({ error: "Gagal menambah kehadiran" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  const serviceDate = typeof req.body.serviceDate === "string" && req.body.serviceDate ? req.body.serviceDate : null;
  const session = typeof req.body.session === "string" ? req.body.session.trim() : "";
  const headcount = Number(req.body.headcount);
  const note = typeof req.body.note === "string" ? req.body.note.trim() : null;
  if (!serviceDate || !session || !Number.isInteger(headcount) || headcount < 0) {
    return res.status(400).json({ error: "Tanggal, sesi, dan jumlah hadir wajib diisi" });
  }
  try {
    const updated = await db
      .update(attendance)
      .set({ serviceDate, session, headcount, note })
      .where(eq(attendance.id, id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Data kehadiran diperbarui" });
  } catch {
    res.status(500).json({ error: "Gagal memperbarui kehadiran" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  try {
    const deleted = await db.delete(attendance).where(eq(attendance.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Data kehadiran dihapus" });
  } catch {
    res.status(500).json({ error: "Gagal menghapus kehadiran" });
  }
});

export default router;

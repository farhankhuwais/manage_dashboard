import { Router } from "express";
import { db } from "../db/index";
import { events } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(events).orderBy(desc(events.eventDate));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Gagal mengambil agenda" });
  }
});

router.post("/", async (req, res) => {
  const eventDate = typeof req.body.eventDate === "string" && req.body.eventDate ? req.body.eventDate : null;
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const time = typeof req.body.time === "string" ? req.body.time.trim() : null;
  const location = typeof req.body.location === "string" ? req.body.location.trim() : null;
  const description = typeof req.body.description === "string" ? req.body.description.trim() : null;
  if (!eventDate || !title) {
    return res.status(400).json({ error: "Tanggal dan nama kegiatan wajib diisi" });
  }
  try {
    await db.insert(events).values({ eventDate, title, time, location, description });
    res.status(201).json({ message: "Agenda ditambahkan" });
  } catch {
    res.status(500).json({ error: "Gagal menambah agenda" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  const eventDate = typeof req.body.eventDate === "string" && req.body.eventDate ? req.body.eventDate : null;
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const time = typeof req.body.time === "string" ? req.body.time.trim() : null;
  const location = typeof req.body.location === "string" ? req.body.location.trim() : null;
  const description = typeof req.body.description === "string" ? req.body.description.trim() : null;
  if (!eventDate || !title) {
    return res.status(400).json({ error: "Tanggal dan nama kegiatan wajib diisi" });
  }
  try {
    const updated = await db
      .update(events)
      .set({ eventDate, title, time, location, description })
      .where(eq(events.id, id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Agenda diperbarui" });
  } catch {
    res.status(500).json({ error: "Gagal memperbarui agenda" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "ID tidak valid" });
  try {
    const deleted = await db.delete(events).where(eq(events.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ message: "Agenda dihapus" });
  } catch {
    res.status(500).json({ error: "Gagal menghapus agenda" });
  }
});

export default router;

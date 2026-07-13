import { Router } from "express";
import { db } from "../db/index";
import { weeklyDues } from "../db/schema";
import { and, eq } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.post("/", async (req, res) => {
  const rawMemberId = req.body.memberId;
  const memberId =
    rawMemberId !== undefined && rawMemberId !== null && rawMemberId !== ""
      ? Number(rawMemberId)
      : null;
  const weekNumber = Number(req.body.weekNumber);
  const year = Number(req.body.year);
  const amount = Number(req.body.amount);
  const dateVal = req.body.date
    ? new Date(`${req.body.date}T00:00:00`)
    : new Date();

  if (
    (memberId !== null && (!Number.isInteger(memberId) || memberId <= 0)) ||
    !Number.isInteger(weekNumber) || weekNumber <= 0 ||
    !Number.isInteger(year) || year <= 0 ||
    !Number.isInteger(amount) || amount <= 0
  ) {
    return res.status(400).json({ error: "Data tidak lengkap atau tidak valid" });
  }

  try {
    if (memberId !== null) {
      const existing = await db.select().from(weeklyDues).where(
        and(
          eq(weeklyDues.memberId, memberId),
          eq(weeklyDues.weekNumber, weekNumber),
          eq(weeklyDues.year, year)
        )
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "Jemaat sudah membayar iuran untuk minggu ini" });
      }
    }

    await db.insert(weeklyDues).values({ memberId, weekNumber, year, amount, date: dateVal });
    res.status(201).json({ message: "Berhasil mencatat iuran" });
  } catch (error) {
    res.status(500).json({ error: "Gagal mencatat iuran" });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(weeklyDues);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data iuran" });
  }
});

// DELETE /api/dues/:id - Hapus catatan iuran/persembahan
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID persembahan tidak valid" });
  }
  try {
    const deleted = await db.delete(weeklyDues).where(eq(weeklyDues.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Data persembahan tidak ditemukan" });
    }
    res.json({ message: "Data persembahan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus data persembahan" });
  }
});

export default router;

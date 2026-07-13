import { Router } from "express";
import { db } from "../db";
import { weeklyDues } from "../db/schema";
import { and, eq } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  const { memberId, weekNumber, year, amount } = req.body;

  if (!memberId || !weekNumber || !year || !amount) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }

  try {
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
    
    await db.insert(weeklyDues).values({ memberId, weekNumber, year, amount });
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

export default router;

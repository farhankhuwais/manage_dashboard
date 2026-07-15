import { Router } from "express";
import { db } from "../db/index";
import { members, offerings, attendance, serviceSchedules, events, followUps } from "../db/schema";
import { sql, eq, desc } from "drizzle-orm";

const router = Router();

const num = (v: any): number => Number(v ?? 0);

const weekStart = (d: Date): Date => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // 0 Minggu .. 6 Sabtu
  const diff = day === 0 ? -6 : 1 - day; // mulai Senin
  x.setUTCDate(x.getUTCDate() + diff);
  return x;
};

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    const todayStr = now.toISOString().slice(0, 10);

    // KPI: jemaat aktif
    const [aktifRow] = await db
      .select({ count: sql`count(*)` })
      .from(members)
      .where(eq(members.status, "Aktif"));

    // Persembahan bulan ini + rincian per kategori
    const whereMonth = sql`extract(year from ${offerings.date}) = ${year} AND extract(month from ${offerings.date}) = ${month}`;
    const [persembahanRow] = await db
      .select({ total: sql`coalesce(sum(${offerings.amount}),0)` })
      .from(offerings)
      .where(whereMonth);
    const rincian = await db
      .select({ category: offerings.category, total: sql`coalesce(sum(${offerings.amount}),0)` })
      .from(offerings)
      .where(whereMonth)
      .groupBy(offerings.category);

    // Kehadiran
    const attRows = await db.select().from(attendance).orderBy(desc(attendance.serviceDate));
    const labels: string[] = [];
    const weekMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const ws = weekStart(new Date(now.getTime() - i * 7 * 86400000));
      const key = ws.toISOString().slice(0, 10);
      labels.push(key);
      weekMap.set(key, 0);
    }
    for (const r of attRows) {
      const ws = weekStart(new Date(r.serviceDate));
      const key = ws.toISOString().slice(0, 10);
      if (weekMap.has(key)) weekMap.set(key, weekMap.get(key)! + num(r.headcount));
    }
    const trenKehadiran = labels.map((label) => ({ label, value: weekMap.get(label)! }));
    const kehadiranMingguIni = trenKehadiran[trenKehadiran.length - 1]?.value ?? 0;

    // Jadwal pelayanan — filter minggu berjalan (Senin→Minggu)
    const schRows = await db.select().from(serviceSchedules).orderBy(desc(serviceSchedules.serviceDate));
    const nowWeekStart = weekStart(now);
    const nowWeekEnd = new Date(nowWeekStart.getTime());
    nowWeekEnd.setUTCDate(nowWeekEnd.getUTCDate() + 6);
    const wsStr = nowWeekStart.toISOString().slice(0, 10);
    const weStr = nowWeekEnd.toISOString().slice(0, 10);
    const timBertugas = schRows.filter((r) => {
      const d = String(r.serviceDate).slice(0, 10);
      return d >= wsStr && d <= weStr;
    });
    const pelayanBertugas = timBertugas.reduce((s, r) => s + num(r.personCount), 0);

    // Agenda mendatang
    const agenda = await db
      .select()
      .from(events)
      .where(sql`${events.eventDate} >= ${todayStr}`)
      .orderBy(events.eventDate);

    // Tindak lanjut
    const followUpRows = await db.select().from(followUps).orderBy(followUps.dueDate);

    // Demografi (umur dari tanggalLahir)
    const demoRows = await db.select({ tanggalLahir: members.tanggalLahir }).from(members);
    const buckets: [string, number, number][] = [
      ["Anak", 0, 12],
      ["Remaja", 13, 17],
      ["Pemuda", 18, 30],
      ["Dewasa", 31, 55],
      ["Lansia", 56, 200],
    ];
    const demografi = buckets.map(([label]) => ({ label, value: 0 }));
    for (const r of demoRows) {
      if (!r.tanggalLahir) continue;
      const dob = new Date(r.tanggalLahir);
      if (isNaN(dob.getTime())) continue;
      let age = now.getUTCFullYear() - dob.getUTCFullYear();
      const m = now.getUTCMonth() - dob.getUTCMonth();
      if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
      const idx = buckets.findIndex(([, min, max]) => age >= min && age <= max);
      if (idx >= 0) demografi[idx].value++;
    }

    res.json({
      kpi: {
        jemaatAktif: num(aktifRow?.count),
        kehadiranMingguIni,
        persembahanBulanIni: num(persembahanRow?.total),
        pelayanBertugas,
      },
      trenKehadiran,
      demografi,
      rincianPersembahan: rincian.map((r) => ({ category: r.category, total: num(r.total) })),
      timBertugas,
      agenda,
      followUps: followUpRows,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal memuat dashboard", cause: error?.message });
  }
});

export default router;

import { Router } from "express";
import { db, ensureMembersColumns } from "../db/index";
import { members } from "../db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const parseId = (raw: string): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.get("/", async (req, res) => {
  try {
    await ensureMembersColumns();
    const data = await db.select().from(members);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data jemaat" });
  }
});

const TEXT_FIELDS = [
  "statusAnggota", "statusWarga", "statusKeluarga", "statusPosisi", "komisi", "tempatLahir", "jenisKelamin", "wargaNegara",
  "statusPernikahan", "golonganDarah", "nik", "alamatDomisili", "kota",
  "noTelp", "pekerjaan", "pendidikanTerakhir", "penyerahanAnak",
  "baptisSidi", "atestasi", "asalGereja",
];
const DATE_FIELDS = [
  "tanggalLahir", "tanggalNikah", "penyerahanAnakTgl", "baptisSidiTgl", "atestasiTgl",
];

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const inRange = (d: Date): boolean => {
  const y = d.getUTCFullYear();
  return y >= 1900 && y <= 2100;
};

const parseDate = (v: unknown): string | null => {
  if (v == null) return null;
  let d: Date | null = null;
  if (v instanceof Date) {
    d = isNaN(v.getTime()) ? null : v;
  } else if (typeof v === "number") {
    if (v < 1) return null;
    const dd = new Date((v - 25569) * 86400000);
    d = isNaN(dd.getTime()) ? null : dd;
  } else if (typeof v === "string") {
    const s = v.trim();
    if (!s || s === "-") return null;
    const dd = new Date(s);
    if (!isNaN(dd.getTime())) {
      d = dd;
    } else {
      const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (m) {
        const d2 = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        d = isNaN(d2.getTime()) ? null : d2;
      }
    }
  }
  if (!d || isNaN(d.getTime()) || !inRange(d)) return null;
  return d.toISOString().slice(0, 10);
};

const buildExtra = (body: Record<string, unknown>) => {
  const extra: Record<string, string | number | null> = {};
  for (const f of TEXT_FIELDS) extra[f] = strOrNull(body[f]);
  for (const f of DATE_FIELDS) extra[f] = parseDate(body[f]);
  return extra;
};

router.post("/", async (req, res) => {
  const { name, status } = req.body;
  if (typeof name !== "string" || !name.trim() || typeof status !== "string" || !status.trim()) {
    return res.status(400).json({ error: "Nama dan status wajib diisi" });
  }

  try {
    await ensureMembersColumns();
    await db.insert(members).values({ name: name.trim(), status: status.trim(), ...buildExtra(req.body) });
    res.status(201).json({ message: "Jemaat ditambahkan" });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal menambahkan jemaat", cause: error?.message });
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

router.post("/bulk", async (req, res) => {
  const body = req.body;
  const list = Array.isArray(body) ? body : body?.data;
  const upsert = body?.upsert === true;
  if (!Array.isArray(list) || list.length === 0) {
    return res.status(400).json({ error: "Data tidak valid" });
  }

  try {
    await ensureMembersColumns();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    for (const item of list) {
      if (!item || typeof item.name !== "string" || !item.name.trim()) {
        skipped++;
        continue;
      }
      const name = item.name.trim();
      const status = typeof item.status === "string" && item.status.trim() ? item.status.trim() : "Aktif";
      const vals = { name, status, ...buildExtra(item) };
      const existing = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.name, name))
        .limit(1);
      if (existing.length > 0) {
        if (upsert) {
          await db.update(members).set(vals).where(eq(members.id, existing[0].id));
          updated++;
        } else {
          skipped++;
        }
      } else {
        await db.insert(members).values(vals);
        inserted++;
      }
    }
    res.status(201).json({
      message: `${inserted} ditambah, ${updated} diperbarui, ${skipped} dilewati`,
      inserted,
      updated,
      skipped,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Gagal import data jemaat",
      cause: error?.message,
      detail: error?.cause?.message || error?.code,
    });
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
    await ensureMembersColumns();
    const updated = await db
      .update(members)
      .set({ name: name.trim(), status: status.trim(), ...buildExtra(req.body) })
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

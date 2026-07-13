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

const buildExtra = (body: Record<string, unknown>) => {
  const extra: Record<string, string | number | null> = {};
  for (const f of TEXT_FIELDS) extra[f] = strOrNull(body[f]);
  for (const f of DATE_FIELDS) extra[f] = strOrNull(body[f]);
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
  const list = req.body;
  if (!Array.isArray(list) || list.length === 0) {
    return res.status(400).json({ error: "Data tidak valid" });
  }

  try {
    await ensureMembersColumns();
    const values: any[] = [];
    for (const item of list) {
      if (!item || typeof item.name !== "string" || !item.name.trim()) continue;
      const status = typeof item.status === "string" && item.status.trim() ? item.status.trim() : "Aktif";
      values.push({ name: item.name.trim(), status, ...buildExtra(item) });
    }
    if (values.length === 0) {
      return res.status(400).json({ error: "Tidak ada baris valid (kolom Nama kosong)" });
    }
    await db.insert(members).values(values);
    res.status(201).json({ message: `${values.length} jemaat ditambahkan`, inserted: values.length });
  } catch (error: any) {
    res.status(500).json({ error: "Gagal import data jemaat", cause: error?.message });
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

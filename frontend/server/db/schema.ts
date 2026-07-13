import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull()
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  statusAnggota: text("status_anggota"),
  noUrut: integer("no_urut"),
  statusPosisi: text("status_posisi"),
  komisi: text("komisi"),
  tempatLahir: text("tempat_lahir"),
  tanggalLahir: date("tanggal_lahir"),
  jenisKelamin: text("jenis_kelamin"),
  wargaNegara: text("warga_negara"),
  statusPernikahan: text("status_pernikahan"),
  tanggalNikah: date("tanggal_nikah"),
  golonganDarah: text("golongan_darah"),
  nik: text("nik"),
  alamatDomisili: text("alamat_domisili"),
  kota: text("kota"),
  noTelp: text("no_telp"),
  pekerjaan: text("pekerjaan"),
  pendidikanTerakhir: text("pendidikan_terakhir"),
  penyerahanAnak: text("penyerahan_anak"),
  penyerahanAnakTgl: date("penyerahan_anak_tgl"),
  baptisSidi: text("baptis_sidi"),
  baptisSidiTgl: date("baptis_sidi_tgl"),
  atestasi: text("atestasi"),
  atestasiTgl: date("atestasi_tgl"),
  asalGereja: text("asal_gereja")
});

export const offerings = pgTable("offerings", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  description: text("description")
});

export const weeklyDues = pgTable("weekly_dues", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull().defaultNow()
});

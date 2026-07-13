"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// Middleware tambahan untuk proteksi rute khusus Admin
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Akses ditolak. Hanya Admin yang dapat mengakses." });
    }
    next();
};
// GET /api/users - List semua akun pengurus
router.get("/", requireAdmin, async (req, res) => {
    try {
        const allUsers = await db_1.db.select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            role: schema_1.users.role,
        }).from(schema_1.users);
        res.json(allUsers);
    }
    catch (error) {
        res.status(500).json({ error: "Gagal mengambil daftar pengguna" });
    }
});
// POST /api/users - Tambah akun baru
router.post("/", requireAdmin, async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return res.status(400).json({ error: "Data tidak lengkap" });
    }
    try {
        const existing = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existing.length > 0) {
            return res.status(400).json({ error: "Email sudah terdaftar" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        await db_1.db.insert(schema_1.users).values({ email, passwordHash, role });
        res.status(201).json({ message: "Akun pengurus berhasil ditambahkan" });
    }
    catch (error) {
        res.status(500).json({ error: "Gagal menambahkan akun" });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map
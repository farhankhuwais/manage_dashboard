"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const data = await db_1.db.select().from(schema_1.members);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Gagal mengambil data jemaat" });
    }
});
router.post("/", async (req, res) => {
    const { name, status } = req.body;
    if (!name || !status) {
        return res.status(400).json({ error: "Nama dan status wajib diisi" });
    }
    try {
        await db_1.db.insert(schema_1.members).values({ name, status });
        res.status(201).json({ message: "Jemaat ditambahkan" });
    }
    catch (error) {
        res.status(500).json({ error: "Gagal menambahkan jemaat" });
    }
});
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.db.delete(schema_1.members).where((0, drizzle_orm_1.eq)(schema_1.members.id, parseInt(id)));
        res.json({ message: "Jemaat berhasil dihapus" });
    }
    catch (error) {
        res.status(500).json({ error: "Gagal menghapus data jemaat" });
    }
});
exports.default = router;
//# sourceMappingURL=members.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    const { memberId, weekNumber, year, amount } = req.body;
    if (!memberId || !weekNumber || !year || !amount) {
        return res.status(400).json({ error: "Data tidak lengkap" });
    }
    try {
        const existing = await db_1.db.select().from(schema_1.weeklyDues).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.weeklyDues.memberId, memberId), (0, drizzle_orm_1.eq)(schema_1.weeklyDues.weekNumber, weekNumber), (0, drizzle_orm_1.eq)(schema_1.weeklyDues.year, year)));
        if (existing.length > 0) {
            return res.status(400).json({ error: "Jemaat sudah membayar iuran untuk minggu ini" });
        }
        await db_1.db.insert(schema_1.weeklyDues).values({ memberId, weekNumber, year, amount });
        res.status(201).json({ message: "Berhasil mencatat iuran" });
    }
    catch (error) {
        res.status(500).json({ error: "Gagal mencatat iuran" });
    }
});
router.get("/", async (req, res) => {
    try {
        const data = await db_1.db.select().from(schema_1.weeklyDues);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: "Gagal mengambil data iuran" });
    }
});
exports.default = router;
//# sourceMappingURL=dues.js.map
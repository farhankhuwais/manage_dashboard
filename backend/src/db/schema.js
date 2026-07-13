"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyDues = exports.offerings = exports.members = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    role: (0, pg_core_1.text)("role").notNull()
});
exports.members = (0, pg_core_1.pgTable)("members", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    status: (0, pg_core_1.text)("status").notNull()
});
exports.offerings = (0, pg_core_1.pgTable)("offerings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.timestamp)("date").notNull().defaultNow(),
    amount: (0, pg_core_1.integer)("amount").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    description: (0, pg_core_1.text)("description")
});
exports.weeklyDues = (0, pg_core_1.pgTable)("weekly_dues", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    memberId: (0, pg_core_1.integer)("member_id").references(() => exports.members.id),
    weekNumber: (0, pg_core_1.integer)("week_number").notNull(),
    year: (0, pg_core_1.integer)("year").notNull(),
    amount: (0, pg_core_1.integer)("amount").notNull(),
    date: (0, pg_core_1.timestamp)("date").notNull().defaultNow()
});
//# sourceMappingURL=schema.js.map
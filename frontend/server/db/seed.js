"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const schema_1 = require("./schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed() {
    const email = "admin@internal.com";
    const password = "bendahara123";
    try {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await index_1.db.insert(schema_1.users).values({
            email,
            passwordHash: hashedPassword,
            role: "admin"
        });
        console.log(`✅ Berhasil membuat akun Admin!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
    catch (error) {
        console.error("Gagal melakukan seeding data:", error);
    }
    finally {
        process.exit(0);
    }
}
seed();
//# sourceMappingURL=seed.js.map
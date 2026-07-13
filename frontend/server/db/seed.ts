import { db } from "./index.js";
import { users } from "./schema.js";
import bcrypt from "bcryptjs";

async function seed() {
  const email = "admin@internal.com";
  const password = "bendahara123";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      role: "admin"
    });

    console.log(`✅ Berhasil membuat akun Admin!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error("Gagal melakukan seeding data:", error);
  } finally {
    process.exit(0);
  }
}

seed();

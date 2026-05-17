import "dotenv/config";
import { db } from "../lib/db/client";
import { settings } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";

const plain = process.argv[2];
if (!plain) {
  console.error("Usage: bun run set-password <plaintext>");
  process.exit(1);
}

const hash = await hashPassword(plain);
const existing = (
  await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
)[0];
if (!existing) {
  await db.insert(settings).values({ id: 1, passwordHash: hash });
} else {
  await db
    .update(settings)
    .set({ passwordHash: hash, updatedAt: new Date() })
    .where(eq(settings.id, 1));
}
console.log("password set");
process.exit(0);

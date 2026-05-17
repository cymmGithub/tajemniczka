import "dotenv/config";
import { readFile } from "node:fs/promises";
import { db } from "../lib/db/client";
import { members } from "../lib/db/schema";
import { normalizePhone } from "../lib/phone/normalize";

interface SeedRow {
  slot: number;
  name: string;
  phone: string;
}

const path = process.argv[2] ?? "scripts/members.json";
const groupId = process.argv[3] ? Number(process.argv[3]) : 1;
if (!Number.isInteger(groupId) || groupId <= 0) {
  console.error(`invalid group id: ${process.argv[3]}`);
  process.exit(1);
}
const raw = await readFile(path, "utf-8");
const rows: SeedRow[] = JSON.parse(raw);

for (const r of rows) {
  const phone = normalizePhone(r.phone);
  await db
    .insert(members)
    .values({ groupId, slot: r.slot, name: r.name, phoneE164: phone })
    .onConflictDoUpdate({
      target: [members.groupId, members.slot],
      set: { name: r.name, phoneE164: phone, updatedAt: new Date() },
    });
  console.log(`seeded group ${groupId} slot ${r.slot}: ${r.name} ${phone}`);
}
console.log("done");
process.exit(0);

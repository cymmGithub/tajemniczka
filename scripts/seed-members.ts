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
const raw = await readFile(path, "utf-8");
const rows: SeedRow[] = JSON.parse(raw);

for (const r of rows) {
  const phone = normalizePhone(r.phone);
  await db
    .insert(members)
    .values({ slot: r.slot, name: r.name, phoneE164: phone })
    .onConflictDoUpdate({
      target: members.slot,
      set: { name: r.name, phoneE164: phone, updatedAt: new Date() },
    });
  console.log(`seeded slot ${r.slot}: ${r.name} ${phone}`);
}
console.log("done");
process.exit(0);

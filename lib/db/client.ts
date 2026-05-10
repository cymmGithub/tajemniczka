import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

let _db: DB | null = null;

function init(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(postgres(url, { prepare: false }), { schema });
}

// Lazy proxy — DATABASE_URL is only required at first query, not at
// module load (which happens during `next build` for static analysis).
export const db = new Proxy({} as DB, {
  get(_t, prop) {
    if (!_db) _db = init();
    const v = (_db as unknown as Record<PropertyKey, unknown>)[prop as PropertyKey];
    return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(_db) : v;
  },
});

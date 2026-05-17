import { cache } from "react";
import { db } from "./client";
import { groups } from "./schema";
import { eq, asc } from "drizzle-orm";

export type Group = typeof groups.$inferSelect;

/**
 * Fetch a single group by id, deduped within a single render via `cache()`.
 * Returns `null` when the group does not exist; callers should call
 * `notFound()` for unknown ids.
 */
export const getGroup = cache(async (id: number): Promise<Group | null> => {
  if (!Number.isInteger(id) || id <= 0) return null;
  const row = (
    await db.select().from(groups).where(eq(groups.id, id)).limit(1)
  )[0];
  return row ?? null;
});

export const listGroups = cache(async (): Promise<Group[]> => {
  return await db.select().from(groups).orderBy(asc(groups.id));
});

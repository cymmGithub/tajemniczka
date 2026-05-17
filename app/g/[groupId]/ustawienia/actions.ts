"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { groups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function setGroupPaused(
  groupId: number,
  paused: boolean,
): Promise<void> {
  await db
    .update(groups)
    .set({ paused, updatedAt: new Date() })
    .where(eq(groups.id, groupId));
  revalidatePath(`/g/${groupId}/ustawienia`);
  revalidatePath(`/g/${groupId}`);
  revalidatePath(`/`);
}

export type UpdateGroupNameResult = {
  error?: "nameRequired" | "shortLabelRequired";
} | null;

export async function updateGroupName(
  groupId: number,
  formData: FormData,
): Promise<UpdateGroupNameResult> {
  const name = String(formData.get("name") ?? "").trim();
  const shortLabel = String(formData.get("shortLabel") ?? "").trim();
  if (!name) return { error: "nameRequired" };
  if (!shortLabel) return { error: "shortLabelRequired" };
  await db
    .update(groups)
    .set({ name, shortLabel, updatedAt: new Date() })
    .where(eq(groups.id, groupId));
  revalidatePath(`/g/${groupId}/ustawienia`);
  revalidatePath(`/g/${groupId}`);
  revalidatePath(`/`);
  return null;
}

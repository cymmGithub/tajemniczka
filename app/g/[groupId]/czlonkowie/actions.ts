"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { normalizePhone, NormalizationError } from "@/lib/phone/normalize";

export type MemberFormState =
  | { error?: "invalidSlot" | "invalidPhone" | "nameRequired" | "invalidGroup" }
  | null;

export async function upsertMember(
  groupId: number,
  slot: number,
  formData: FormData,
): Promise<MemberFormState> {
  if (!Number.isInteger(groupId) || groupId <= 0) return { error: "invalidGroup" };
  if (slot < 1 || slot > 20) return { error: "invalidSlot" };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "nameRequired" };
  let phone: string;
  try {
    phone = normalizePhone(String(formData.get("phone") ?? ""));
  } catch (e) {
    if (e instanceof NormalizationError) return { error: "invalidPhone" };
    throw e;
  }
  await db
    .insert(members)
    .values({ groupId, slot, name, phoneE164: phone })
    .onConflictDoUpdate({
      target: [members.groupId, members.slot],
      set: { name, phoneE164: phone, updatedAt: new Date() },
    });
  revalidatePath(`/g/${groupId}/czlonkowie`);
  revalidatePath(`/g/${groupId}`);
  return null;
}

export async function deleteMember(groupId: number, slot: number): Promise<void> {
  await db
    .delete(members)
    .where(and(eq(members.groupId, groupId), eq(members.slot, slot)));
  revalidatePath(`/g/${groupId}/czlonkowie`);
  revalidatePath(`/g/${groupId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { normalizePhone, NormalizationError } from "@/lib/phone/normalize";

export type MemberFormState = { error?: "invalidSlot" | "invalidPhone" | "nameRequired" } | null;

export async function upsertMember(slot: number, formData: FormData): Promise<MemberFormState> {
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
  await db.insert(members).values({ slot, name, phoneE164: phone })
    .onConflictDoUpdate({
      target: members.slot,
      set: { name, phoneE164: phone, updatedAt: new Date() },
    });
  revalidatePath("/czlonkowie");
  revalidatePath("/");
  return null;
}

export async function deleteMember(slot: number): Promise<void> {
  await db.delete(members).where(eq(members.slot, slot));
  revalidatePath("/czlonkowie");
  revalidatePath("/");
}

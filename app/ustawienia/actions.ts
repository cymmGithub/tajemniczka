"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { twilioClient, fromNumber } from "@/lib/sms/twilio-client";
import { T } from "@/lib/i18n/pl";

export async function setPaused(paused: boolean): Promise<void> {
  await db
    .update(settings)
    .set({ paused, updatedAt: new Date() })
    .where(eq(settings.id, 1));
  revalidatePath("/ustawienia");
}

export type TestSmsResult = { ok: boolean; error?: string };
export async function sendTestSms(): Promise<TestSmsResult> {
  const dad = process.env.DAD_PHONE_NUMBER;
  if (!dad) return { ok: false, error: "DAD_PHONE_NUMBER not set" };
  try {
    await twilioClient().messages.create({
      to: dad,
      from: fromNumber(),
      body: T.settings.testBody,
    });
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? "unknown" };
  }
}

export type ChangePasswordResult = {
  error?: "passwordsDoNotMatch" | "notConfigured" | "invalid";
};
export async function changePassword(formData: FormData): Promise<ChangePasswordResult> {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm) return { error: "passwordsDoNotMatch" };
  const row = (
    await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
  )[0];
  if (!row?.passwordHash) return { error: "notConfigured" };
  const ok = await verifyPassword(current, row.passwordHash);
  if (!ok) return { error: "invalid" };
  const hash = await hashPassword(next);
  await db
    .update(settings)
    .set({ passwordHash: hash, updatedAt: new Date() })
    .where(eq(settings.id, 1));
  return {};
}

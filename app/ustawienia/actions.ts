"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sendOne, smsTestMode } from "@/lib/sms/smsapi-client";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { T } from "@/lib/i18n/pl";

export async function setPaused(paused: boolean): Promise<void> {
  await db
    .update(settings)
    .set({ paused, updatedAt: new Date() })
    .where(eq(settings.id, 1));
  revalidatePath("/ustawienia");
}

export type TestSmsResult =
  | { ok: true; testMode: boolean }
  | { ok: false; error: string };

export async function sendTestSms(
  _prev: TestSmsResult | null,
  _form: FormData,
): Promise<TestSmsResult> {
  const dad = process.env.DAD_PHONE_NUMBER;
  if (!dad || !parsePhoneNumberFromString(dad)?.isValid()) {
    return { ok: false, error: "DAD_PHONE_NUMBER not set or invalid" };
  }
  const result = await sendOne(dad, T.settings.testBody);
  if (result.ok) return { ok: true, testMode: smsTestMode() };
  return { ok: false, error: result.errorMessage };
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

"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW = 15 * 60 * 1000;
const LIMIT = 5;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (a.count >= LIMIT) return false;
  a.count++;
  return true;
}

export type LoginState = { error?: "invalid" | "rate" } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!rateLimit("global")) return { error: "rate" };

  const row = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  const hash = row[0]?.passwordHash;
  if (!hash) return { error: "invalid" };
  const ok = await verifyPassword(password, hash);
  if (!ok) return { error: "invalid" };

  await createSession();
  redirect("/");
}

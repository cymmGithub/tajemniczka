import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sendRuns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { evaluateRun } from "@/lib/sms/evaluate-run";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const recent = (
    await db
      .select()
      .from(sendRuns)
      .where(eq(sendRuns.status, "in_progress"))
      .orderBy(desc(sendRuns.firedAt))
      .limit(1)
  )[0];
  if (!recent) return NextResponse.json({ skipped: "no in_progress run" });
  await evaluateRun(recent.id);
  return NextResponse.json({ ok: true, runId: recent.id });
}

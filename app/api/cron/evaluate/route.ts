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
  const inProgress = await db
    .select({ id: sendRuns.id, groupId: sendRuns.groupId })
    .from(sendRuns)
    .where(eq(sendRuns.status, "in_progress"))
    .orderBy(desc(sendRuns.firedAt));

  if (inProgress.length === 0) {
    return NextResponse.json({ skipped: "no in_progress runs" });
  }

  const evaluated = [];
  for (const r of inProgress) {
    try {
      await evaluateRun(r.id);
      evaluated.push({ runId: r.id, groupId: r.groupId, ok: true });
    } catch (e) {
      evaluated.push({
        runId: r.id,
        groupId: r.groupId,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ ok: true, evaluated });
}

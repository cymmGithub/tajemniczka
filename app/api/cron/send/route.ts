import { NextResponse } from "next/server";
import { nowInWarsaw, isLastDayOfMonth, nextDayMonthYear } from "@/lib/tz";
import { runMonthlySend } from "@/lib/sms/send-monthly";
import { db } from "@/lib/db/client";
import { groups } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = nowInWarsaw();
  if (!isLastDayOfMonth(now)) {
    return NextResponse.json({ skipped: "not last day", now: now.toISOString() });
  }
  const target = nextDayMonthYear(now);

  const allGroups = await db
    .select({ id: groups.id })
    .from(groups)
    .orderBy(asc(groups.id));

  const results = [];
  for (const g of allGroups) {
    try {
      const r = await runMonthlySend(target.year, target.month, g.id);
      results.push({ ok: true, ...r });
    } catch (e) {
      results.push({
        groupId: g.id,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ ok: true, target, results });
}

import { NextResponse } from "next/server";
import { nowInWarsaw, isLastDayOfMonth, nextDayMonthYear } from "@/lib/tz";
import { runMonthlySend } from "@/lib/sms/send-monthly";

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
  const result = await runMonthlySend(target.year, target.month);
  return NextResponse.json({ ok: true, ...result, target });
}

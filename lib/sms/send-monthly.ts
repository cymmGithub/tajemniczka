import { db } from "@/lib/db/client";
import { members, sendRuns, sendResults, settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatSmsBody } from "@/lib/rotation/format";
import { twilioClient, fromNumber, statusCallbackUrl } from "./twilio-client";

export interface MonthlySendResult {
  runId: number;
  pausedSkipped: boolean;
}

export async function runMonthlySend(
  targetYear: number,
  targetMonth: number,
): Promise<MonthlySendResult> {
  const cfg = (
    await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
  )[0];

  if (cfg?.paused) {
    const [run] = await db
      .insert(sendRuns)
      .values({
        firedAt: new Date(),
        targetYear,
        targetMonth,
        status: "paused",
        totalIntended: 0,
        totalSentOk: 0,
        totalFailed: 0,
        notes: "settings.paused = true",
      })
      .returning({ id: sendRuns.id });
    return { runId: run.id, pausedSkipped: true };
  }

  const memberRows = await db.select().from(members);
  const intended = memberRows.length;

  const [run] = await db
    .insert(sendRuns)
    .values({
      firedAt: new Date(),
      targetYear,
      targetMonth,
      status: "in_progress",
      totalIntended: intended,
      totalSentOk: 0,
      totalFailed: 0,
    })
    .returning({ id: sendRuns.id });

  const tw = twilioClient();
  for (const m of memberRows) {
    const body = formatSmsBody(m.slot, targetYear, targetMonth);
    const [resultRow] = await db
      .insert(sendResults)
      .values({
        runId: run.id,
        slot: m.slot,
        memberName: m.name,
        phoneE164: m.phoneE164,
        messageBody: body,
        status: "queued",
      })
      .returning({ id: sendResults.id });
    try {
      const msg = await tw.messages.create({
        to: m.phoneE164,
        from: fromNumber(),
        body,
        statusCallback: statusCallbackUrl(),
      });
      await db
        .update(sendResults)
        .set({ twilioSid: msg.sid, status: "sent", updatedAt: new Date() })
        .where(eq(sendResults.id, resultRow.id));
    } catch (e: unknown) {
      const err = e as { code?: string | number; message?: string };
      await db
        .update(sendResults)
        .set({
          status: "failed",
          errorCode: err.code != null ? String(err.code) : null,
          errorMessage: err.message ?? "unknown",
          updatedAt: new Date(),
        })
        .where(eq(sendResults.id, resultRow.id));
    }
  }

  return { runId: run.id, pausedSkipped: false };
}

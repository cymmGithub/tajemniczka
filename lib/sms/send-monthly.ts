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

  if (memberRows.length === 0) {
    return { runId: run.id, pausedSkipped: false };
  }

  // Bulk-insert all "queued" rows in a single round-trip, then dispatch
  // Twilio calls in parallel. Twilio's messages.create() returns once the
  // message is queued on their side (~200-500ms each), so 20 parallel calls
  // complete in well under 1s wall-clock — fits the 10s Hobby function limit.
  const queuedRows = memberRows.map((m) => ({
    runId: run.id,
    slot: m.slot,
    memberName: m.name,
    phoneE164: m.phoneE164,
    messageBody: formatSmsBody(m.slot, targetYear, targetMonth),
    status: "queued" as const,
  }));

  const inserted = await db
    .insert(sendResults)
    .values(queuedRows)
    .returning({ id: sendResults.id, slot: sendResults.slot });

  const idBySlot = new Map(inserted.map((r) => [r.slot, r.id]));
  const tw = twilioClient();
  const from = fromNumber();
  const statusCb = statusCallbackUrl();

  await Promise.allSettled(
    memberRows.map(async (m) => {
      const resultId = idBySlot.get(m.slot);
      if (resultId == null) return;
      const body = formatSmsBody(m.slot, targetYear, targetMonth);
      try {
        const msg = await tw.messages.create({
          to: m.phoneE164,
          from,
          body,
          statusCallback: statusCb,
        });
        await db
          .update(sendResults)
          .set({ twilioSid: msg.sid, status: "sent", updatedAt: new Date() })
          .where(eq(sendResults.id, resultId));
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
          .where(eq(sendResults.id, resultId));
      }
    }),
  );

  return { runId: run.id, pausedSkipped: false };
}

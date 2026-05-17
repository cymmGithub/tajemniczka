import { db } from "@/lib/db/client";
import { groups, members, sendRuns, sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatSmsBody } from "@/lib/rotation/format";
import { sendOne } from "./smsapi-client";

export interface MonthlySendResult {
  runId: number;
  groupId: number;
  pausedSkipped: boolean;
}

export async function runMonthlySend(
  targetYear: number,
  targetMonth: number,
  groupId: number,
): Promise<MonthlySendResult> {
  const group = (
    await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)
  )[0];
  if (!group) {
    throw new Error(`group ${groupId} does not exist`);
  }

  if (group.paused) {
    const [run] = await db
      .insert(sendRuns)
      .values({
        groupId,
        firedAt: new Date(),
        targetYear,
        targetMonth,
        status: "paused",
        totalIntended: 0,
        totalSentOk: 0,
        totalFailed: 0,
        notes: "groups.paused = true",
      })
      .returning({ id: sendRuns.id });
    return { runId: run.id, groupId, pausedSkipped: true };
  }

  const anchor = { year: group.anchorYear, month: group.anchorMonth };

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.groupId, groupId));
  const intended = memberRows.length;

  const [run] = await db
    .insert(sendRuns)
    .values({
      groupId,
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
    return { runId: run.id, groupId, pausedSkipped: false };
  }

  // Bulk-insert all "queued" rows in a single round-trip, then dispatch
  // smsapi calls in parallel. sendSms returns once smsapi accepts the message
  // (~200-500ms each); 20 parallel calls complete in well under the 10s Hobby
  // function limit. Delivery status arrives asynchronously via notify_url.
  const queuedRows = memberRows.map((m) => ({
    runId: run.id,
    groupId,
    slot: m.slot,
    memberName: m.name,
    phoneE164: m.phoneE164,
    messageBody: formatSmsBody(m.slot, targetYear, targetMonth, anchor),
    status: "queued" as const,
  }));

  const inserted = await db
    .insert(sendResults)
    .values(queuedRows)
    .returning({ id: sendResults.id, slot: sendResults.slot });

  const idBySlot = new Map(inserted.map((r) => [r.slot, r.id]));
  const bodyBySlot = new Map(queuedRows.map((r) => [r.slot, r.messageBody]));

  await Promise.allSettled(
    memberRows.map(async (m) => {
      const resultId = idBySlot.get(m.slot);
      const body = bodyBySlot.get(m.slot);
      if (resultId == null || body == null) return;
      const result = await sendOne(m.phoneE164, body);
      if (result.ok) {
        await db
          .update(sendResults)
          .set({
            providerMessageId: result.providerMessageId,
            status: result.status,
            updatedAt: new Date(),
          })
          .where(eq(sendResults.id, resultId));
      } else {
        await db
          .update(sendResults)
          .set({
            status: "failed",
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
            updatedAt: new Date(),
          })
          .where(eq(sendResults.id, resultId));
      }
    }),
  );

  return { runId: run.id, groupId, pausedSkipped: false };
}

import { db } from "@/lib/db/client";
import { sendRuns, sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { twilioClient, fromNumber } from "./twilio-client";
import { T } from "@/lib/i18n/pl";

export async function evaluateRun(runId: number): Promise<void> {
  const results = await db
    .select()
    .from(sendResults)
    .where(eq(sendResults.runId, runId));
  if (results.length === 0) return;

  const failed = results.filter(
    (r) => r.status === "failed" || r.status === "undelivered",
  );
  const ok = results.filter(
    (r) => r.status === "delivered" || r.status === "sent",
  );
  const status = failed.length === 0 ? "success" : "partial_failure";

  await db
    .update(sendRuns)
    .set({
      status,
      totalSentOk: ok.length,
      totalFailed: failed.length,
    })
    .where(eq(sendRuns.id, runId));

  if (failed.length > 0) {
    const dad = process.env.DAD_PHONE_NUMBER;
    if (!dad) return;
    const tw = twilioClient();
    const body = T.failureSms(failed.map((f) => f.memberName));
    try {
      await tw.messages.create({ to: dad, from: fromNumber(), body });
    } catch (e) {
      console.error("Failed to send failure-notification SMS to dad", e);
    }
  }
}

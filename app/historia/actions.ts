"use server";

import { db } from "@/lib/db/client";
import { sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendOne } from "@/lib/sms/smsapi-client";

export async function retrySend(resultId: number): Promise<void> {
  const r = (
    await db
      .select()
      .from(sendResults)
      .where(eq(sendResults.id, resultId))
      .limit(1)
  )[0];
  if (!r) return;
  const result = await sendOne(r.phoneE164, r.messageBody);
  if (result.ok) {
    await db
      .update(sendResults)
      .set({
        providerMessageId: result.providerMessageId,
        status: result.status,
        errorCode: null,
        errorMessage: null,
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
  revalidatePath(`/historia/${r.runId}`);
}

"use server";

import { db } from "@/lib/db/client";
import { sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  twilioClient,
  fromNumber,
  statusCallbackUrl,
} from "@/lib/sms/twilio-client";

export async function retrySend(resultId: number): Promise<void> {
  const r = (
    await db
      .select()
      .from(sendResults)
      .where(eq(sendResults.id, resultId))
      .limit(1)
  )[0];
  if (!r) return;
  try {
    const msg = await twilioClient().messages.create({
      to: r.phoneE164,
      from: fromNumber(),
      body: r.messageBody,
      statusCallback: statusCallbackUrl(),
    });
    await db
      .update(sendResults)
      .set({
        twilioSid: msg.sid,
        status: "sent",
        errorCode: null,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(sendResults.id, resultId));
  } catch (e: unknown) {
    const err = e as { message?: string };
    await db
      .update(sendResults)
      .set({
        status: "failed",
        errorMessage: err.message ?? "unknown",
        updatedAt: new Date(),
      })
      .where(eq(sendResults.id, resultId));
  }
  revalidatePath(`/historia/${r.runId}`);
}

import { NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/db/client";
import { sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.APP_BASE_URL ?? ""}/api/twilio/webhook`;
  const formText = await req.text();
  const params = Object.fromEntries(new URLSearchParams(formText).entries());

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }
  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    return NextResponse.json({ error: "bad signature" }, { status: 403 });
  }

  const sid = params.MessageSid;
  const status = params.MessageStatus;
  if (!sid || !status) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const allowed = ["queued", "sent", "delivered", "failed", "undelivered"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ ignored: status });
  }

  await db
    .update(sendResults)
    .set({
      status,
      errorCode: params.ErrorCode ?? null,
      errorMessage: params.ErrorMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(sendResults.twilioSid, sid));

  return NextResponse.json({ ok: true });
}

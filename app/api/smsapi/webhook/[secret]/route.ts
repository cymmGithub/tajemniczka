import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sendResults } from "@/lib/db/schema";
import { mapSmsapiStatus } from "@/lib/sms/smsapi-client";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ secret: string }> },
) {
  const { secret } = await ctx.params;
  const expected = process.env.SMSAPI_WEBHOOK_SECRET;
  if (!expected) {
    return new NextResponse("server not configured", { status: 500 });
  }
  if (!safeEqual(secret, expected)) {
    return new NextResponse("bad secret", { status: 403 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;
  const msgId = sp.get("MsgId");
  const statusName = sp.get("status_name") ?? sp.get("status");
  if (!msgId || !statusName) {
    return new NextResponse("missing fields", { status: 400 });
  }

  const status = mapSmsapiStatus(statusName);
  const isFinalFailure = status === "undelivered";

  // smsapi retries callbacks until it sees "OK"; the `ne(status)` guard makes
  // repeated identical callbacks a no-op write (touches zero rows).
  await db
    .update(sendResults)
    .set({
      status,
      errorCode: isFinalFailure ? statusName : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sendResults.providerMessageId, msgId),
        ne(sendResults.status, status),
      ),
    );

  return new NextResponse("OK");
}

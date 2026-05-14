import { SMSAPI } from "smsapi";

export type SendResultStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "undelivered"
  | "failed";

let _client: SMSAPI | null = null;

export function smsapiClient(): SMSAPI {
  if (_client) return _client;
  const token = process.env.SMSAPI_TOKEN;
  if (!token) throw new Error("SMSAPI_TOKEN missing");
  _client = new SMSAPI(token);
  return _client;
}

export function smsFrom(): string | undefined {
  const f = process.env.SMSAPI_FROM;
  return f && f.length > 0 ? f : undefined;
}

export function smsTestMode(): boolean {
  return process.env.SMSAPI_TEST_MODE === "1";
}

// smsapi cannot reach localhost from its public servers and logs callback
// errors (HTTP 403) when notify_url points to a non-public host. In dev we
// skip the URL entirely; on prod APP_BASE_URL is the Vercel domain and the
// webhook works normally.
export function smsNotifyUrl(): string | undefined {
  const base = process.env.APP_BASE_URL;
  if (!base) return undefined;
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(base)) {
    return undefined;
  }
  const secret = process.env.SMSAPI_WEBHOOK_SECRET;
  if (!secret) return undefined;
  return `${base.replace(/\/$/, "")}/api/smsapi/webhook/${secret}`;
}

// smsapi rejects numbers with a leading "+" ("error 13: No correct phone numbers")
// even though it documents E.164 elsewhere. We store E.164 in DB; strip "+" here.
export function smsapiNumber(e164: string): string {
  return e164.startsWith("+") ? e164.slice(1) : e164;
}

export function smsBaseDetails() {
  const notifyUrl = smsNotifyUrl();
  return {
    from: smsFrom(),
    test: smsTestMode(),
    encoding: "utf-8" as const,
    ...(notifyUrl ? { notifyUrl } : {}),
  };
}

const TERMINAL_NON_DELIVERED = new Set([
  "UNDELIVERED",
  "FAILED",
  "EXPIRED",
  "REJECTED",
  "NOT_FOUND",
  "STOP",
  "UNKNOWN",
]);

export function mapSmsapiStatus(s: string): SendResultStatus {
  const up = s.toUpperCase();
  if (up === "DELIVERED") return "delivered";
  if (up === "SENT") return "sent";
  if (up === "QUEUE" || up === "ACCEPTED") return "queued";
  if (TERMINAL_NON_DELIVERED.has(up)) return "undelivered";
  return "queued";
}

export type SendOneOk = {
  ok: true;
  providerMessageId: string;
  status: SendResultStatus;
};
export type SendOneErr = {
  ok: false;
  errorCode: string | null;
  errorMessage: string;
};

export async function sendOne(
  phoneE164: string,
  body: string,
): Promise<SendOneOk | SendOneErr> {
  try {
    const resp = await smsapiClient().sms.sendSms(
      smsapiNumber(phoneE164),
      body,
      smsBaseDetails(),
    );
    const entry = resp.list[0];
    return {
      ok: true,
      providerMessageId: entry.id,
      status: mapSmsapiStatus(entry.status),
    };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return {
      ok: false,
      errorCode: err.status != null ? String(err.status) : null,
      errorMessage: err.message ?? "unknown",
    };
  }
}

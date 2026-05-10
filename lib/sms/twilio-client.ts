import twilio, { Twilio } from "twilio";

let _client: Twilio | null = null;

export function twilioClient(): Twilio {
  if (_client) return _client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials missing");
  _client = twilio(sid, token);
  return _client;
}

export function fromNumber(): string {
  const f = process.env.TWILIO_FROM_NUMBER;
  if (!f) throw new Error("TWILIO_FROM_NUMBER missing");
  return f;
}

export function statusCallbackUrl(): string {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("APP_BASE_URL missing");
  return `${base.replace(/\/$/, "")}/api/twilio/webhook`;
}

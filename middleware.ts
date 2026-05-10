import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "tajemniczka_session";
const PUBLIC_PATHS = [
  "/login",
  "/api/twilio/webhook",
  "/api/cron/send",
  "/api/cron/evaluate",
];
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

async function hmacHex(key: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function valid(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const [issued, sig] = cookieValue.split(".");
  if (!issued || !sig) return false;
  const s = process.env.SESSION_SECRET;
  if (!s) return false;
  const expected = await hmacHex(s, issued);
  if (!constantTimeEqual(sig, expected)) return false;
  return Date.now() - Number(issued) < MAX_AGE_MS;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!(await valid(cookie))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-).*)"],
};

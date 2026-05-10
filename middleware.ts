import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "tajemniczka_session";
const PUBLIC_PATHS = [
  "/login",
  "/api/twilio/webhook",
  "/api/cron/send",
  "/api/cron/evaluate",
];
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function valid(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const [issued, sig] = cookieValue.split(".");
  if (!issued || !sig) return false;
  const s = process.env.SESSION_SECRET;
  if (!s) return false;
  const expected = createHmac("sha256", s).update(issued).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
  } catch {
    return false;
  }
  return Date.now() - Number(issued) < MAX_AGE_MS;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!valid(cookie)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-).*)"],
};

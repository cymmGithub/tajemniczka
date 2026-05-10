# Tajemniczka MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Polish-language Next.js + Vercel webapp that automates dad's monthly *kółko różańcowe* SMS reminders for a 20-member rotation.

**Architecture:** Single Next.js 15 App Router app, Vercel hosting, Vercel Postgres (via Drizzle), Twilio for SMS. Two daily cron routes (`/api/cron/send` 09:00, `/api/cron/evaluate` 09:05 Europe/Warsaw) that fire the monthly job only when tomorrow is the 1st of a new month. Pure-function rotation algorithm (no per-month rows). Single-password auth, HTTP-only session cookie. Mobile-first PWA, REM units, Tailwind.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Bun (local dev) · Drizzle ORM · Vercel Postgres · Tailwind CSS · Twilio SDK · bcryptjs · libphonenumber-js · date-fns + date-fns-tz · Vitest (testing)

**Authoritative references:** `spec.md` (full functional spec) and `qa.md` (decision provenance). When this plan abbreviates UI details, those documents are canonical.

---

## File Structure

```
tajemniczka/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── drizzle.config.ts
├── vitest.config.ts
├── vercel.json                       # cron schedule
├── middleware.ts                     # auth gate (Next.js)
├── .env.example
├── .gitignore
├── public/
│   ├── manifest.webmanifest          # PWA
│   └── icon-{192,512}.png            # PWA icons (placeholder OK for v1)
├── app/
│   ├── layout.tsx                    # root layout, lang="pl"
│   ├── globals.css                   # tailwind + base
│   ├── page.tsx                      # Tablica (monthly view)
│   ├── login/page.tsx
│   ├── login/actions.ts
│   ├── czlonkowie/page.tsx           # member list
│   ├── czlonkowie/[slot]/page.tsx    # edit member
│   ├── czlonkowie/actions.ts
│   ├── historia/page.tsx
│   ├── historia/[runId]/page.tsx
│   ├── historia/actions.ts
│   ├── ustawienia/page.tsx
│   ├── ustawienia/actions.ts
│   ├── api/twilio/webhook/route.ts
│   ├── api/cron/send/route.ts
│   ├── api/cron/evaluate/route.ts
│   └── logout/route.ts
├── lib/
│   ├── db/client.ts
│   ├── db/schema.ts
│   ├── auth/password.ts
│   ├── auth/session.ts
│   ├── rotation/ring.ts
│   ├── rotation/algorithm.ts
│   ├── rotation/format.ts
│   ├── phone/normalize.ts
│   ├── sms/twilio-client.ts
│   ├── sms/send-monthly.ts
│   ├── sms/evaluate-run.ts
│   ├── i18n/pl.ts
│   └── tz.ts
├── components/
│   ├── MonthSwitcher.tsx
│   ├── MemberRow.tsx
│   └── PauseToggle.tsx
├── scripts/
│   ├── seed-members.ts
│   ├── set-password.ts
│   └── migrate.ts
└── tests/
    ├── rotation/algorithm.test.ts
    ├── rotation/format.test.ts
    ├── phone/normalize.test.ts
    └── auth/password.test.ts
```

---

## Conventions

- **Bun for local commands.** `bun install`, `bun run …`. Never npm/npx.
- **REM only** in CSS — never px. Tailwind config sets `rem`-based scale.
- **No Co-Authored-By Claude** in commit messages.
- **TDD for pure logic** (rotation, format, phone, password). UI screens are tested manually (mobile viewport).
- **Frequent commits.** Every task ends with at least one commit.
- **Polish UI strings** live in `lib/i18n/pl.ts` only — no inline strings in components.

---

## Task 0: Initialize repo

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Init git**

```bash
cd /home/cymm/projects/tajemniczka
git init -b main
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.next/
.vercel/
.env
.env.local
.env.*.local
*.log
.DS_Store
dist/
coverage/
.turbo/
```

- [ ] **Step 3: Initial commit**

```bash
git add .gitignore spec.md qa.md docs/
git commit -m "chore: initial commit with spec, qa, and plan"
```

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Initialize Next.js with Bun**

```bash
bun create next-app@latest . --typescript --tailwind --app --src-dir false --no-import-alias --use-bun --eslint
```

When prompted about overwriting non-empty directory, choose to keep existing files (spec.md, qa.md, docs/).

- [ ] **Step 2: Verify it runs**

```bash
bun run dev
```

Expected: server starts at `http://localhost:3000`. Kill with Ctrl+C.

- [ ] **Step 3: Set Polish lang on root layout**

Edit `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tajemniczka",
  description: "Kółko różańcowe — automatyczne przypomnienia tajemnic",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Replace `app/page.tsx` with placeholder**

```tsx
export default function Home() {
  return <main className="p-6"><h1 className="text-2xl">Tajemniczka</h1></main>;
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 with Tailwind, set Polish lang"
```

---

## Task 2: Configure Tailwind for REM-based scale

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`

- [ ] **Step 1: Set base font-size and rem-based spacing**

Edit `app/globals.css` (replace contents):

```css
@import "tailwindcss";

:root {
  font-size: 16px; /* 1rem = 16px baseline */
}

@media (min-width: 1024px) {
  :root { font-size: 17px; }
}

body {
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01";
}
```

- [ ] **Step 2: Lock REM convention into the project**

Add a tiny `STYLE.md` at repo root:

```markdown
# Style

- All sizes in `rem` (or Tailwind's rem-based utilities). Never `px`.
- Spacing: prefer Tailwind utilities (already rem under the hood).
- Mobile-first; design at 360px viewport, scale up.
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css STYLE.md
git commit -m "style: rem-based scale, mobile-first baseline"
```

---

## Task 3: Add core dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
bun add drizzle-orm postgres twilio bcryptjs libphonenumber-js date-fns date-fns-tz
```

- [ ] **Step 2: Install dev deps**

```bash
bun add -d drizzle-kit @types/bcryptjs vitest @vitest/ui tsx
```

- [ ] **Step 3: Add scripts to package.json**

In `package.json`, ensure `scripts` includes:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:run": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "tsx scripts/migrate.ts",
    "seed": "tsx scripts/seed-members.ts",
    "set-password": "tsx scripts/set-password.ts"
  }
}
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock vitest.config.ts
git commit -m "chore: add core deps (drizzle, twilio, vitest, bcrypt)"
```

---

## Task 4: Polish i18n strings

**Files:**
- Create: `lib/i18n/pl.ts`

- [ ] **Step 1: Write all user-facing strings in one module**

Create `lib/i18n/pl.ts`:

```ts
export const MONTHS_PL = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
] as const;

export const MONTHS_PL_TITLE = MONTHS_PL.map(
  (m) => m.charAt(0).toUpperCase() + m.slice(1),
);

export const TAJEMNICE_LONG: Record<"Ś" | "B" | "CH" | "R", string> = {
  "Ś":  "Światła",
  "B":  "Bolesna",
  "CH": "Chwalebna",
  "R":  "Radosna",
};

export const T = {
  appName: "Tajemniczka",
  vacant: "(wakat)",
  showPhones: "Pokaż numery",
  hidePhones: "Ukryj numery",
  login: {
    title: "Zaloguj",
    passwordLabel: "Hasło",
    submit: "Zaloguj",
    invalid: "Nieprawidłowe hasło.",
    rateLimited: "Zbyt wiele prób. Spróbuj ponownie później.",
  },
  nav: {
    tablica: "Tablica",
    czlonkowie: "Członkowie",
    historia: "Historia",
    ustawienia: "Ustawienia",
    logout: "Wyloguj",
  },
  members: {
    title: "Członkowie",
    add: "Dodaj członka",
    name: "Imię i nazwisko",
    phone: "Numer telefonu",
    save: "Zapisz",
    cancel: "Anuluj",
    remove: "Usuń członka",
    confirmRemove: "Czy na pewno usunąć tego członka?",
    invalidPhone: "Nieprawidłowy numer telefonu.",
    nameRequired: "Imię i nazwisko jest wymagane.",
  },
  history: {
    title: "Historia",
    noRuns: "Brak wysłanych przypomnień.",
    sentCount: (sent: number, total: number) => `Wysłano ${sent}/${total}`,
    statuses: {
      success: "Sukces",
      partial_failure: "Częściowo niepowodzenie",
      fatal_error: "Błąd",
      paused: "Wstrzymano",
      in_progress: "W trakcie",
    },
    retry: "Spróbuj ponownie",
    details: "Szczegóły",
  },
  settings: {
    title: "Ustawienia",
    pauseLabel: "Pauza wysyłki",
    pauseHelp: "Gdy włączone, najbliższa wysyłka SMS zostanie pominięta.",
    sendTest: "Wyślij testowy SMS",
    testSent: "SMS testowy wysłany.",
    testBody: "Tajemniczka — test wysyłki. Jeśli to widzisz, wszystko działa.",
    changePassword: "Zmień hasło",
    currentPassword: "Obecne hasło",
    newPassword: "Nowe hasło",
    confirmPassword: "Potwierdź nowe hasło",
    passwordsDoNotMatch: "Hasła nie są zgodne.",
    passwordChanged: "Hasło zmienione.",
  },
  failureSms: (names: string[]) =>
    `Tajemniczka: nie wysłano SMS do: ${names.join(", ")}. Sprawdź aplikację.`,
  monthLabel: (year: number, month: number) =>
    `${MONTHS_PL_TITLE[month - 1]} ${year}`,
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/i18n/pl.ts
git commit -m "feat(i18n): polish strings module"
```

---

## Task 5: Timezone utility

**Files:**
- Create: `lib/tz.ts`

- [ ] **Step 1: Write TZ helpers**

Create `lib/tz.ts`:

```ts
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, getDate, getMonth, getYear } from "date-fns";

export const TZ = "Europe/Warsaw";

export function nowInWarsaw(): Date {
  return toZonedTime(new Date(), TZ);
}

export function isLastDayOfMonth(date: Date): boolean {
  const tomorrow = addDays(date, 1);
  return getDate(tomorrow) === 1;
}

/** Returns { year, month } (1–12) of the day after `date` in Warsaw time. */
export function nextDayMonthYear(date: Date): { year: number; month: number } {
  const t = addDays(date, 1);
  return { year: getYear(t), month: getMonth(t) + 1 };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/tz.ts
git commit -m "feat(tz): europe/warsaw helpers (nowInWarsaw, isLastDayOfMonth)"
```

---

## Task 6: Rotation ring constant

**Files:**
- Create: `lib/rotation/ring.ts`

- [ ] **Step 1: Write the canonical 20-position ring**

Create `lib/rotation/ring.ts`:

```ts
export type TajemnicaCode = "Ś" | "B" | "CH" | "R";

export interface RingEntry {
  roman: "I" | "II" | "III" | "IV" | "V";
  group: TajemnicaCode;
  /** Compact label: "I Ś", "V CH" — used in UI tables. */
  short: string;
}

const ROMAN = ["I", "II", "III", "IV", "V"] as const;
const GROUPS: TajemnicaCode[] = ["Ś", "B", "CH", "R"];

export const RING: ReadonlyArray<RingEntry> = GROUPS.flatMap((group) =>
  ROMAN.map((roman) => ({ roman, group, short: `${roman} ${group}` })),
);

export const ANCHOR_YEAR = 2026;
export const ANCHOR_MONTH = 6; // June 2026 = month 0 of rotation
```

- [ ] **Step 2: Commit**

```bash
git add lib/rotation/ring.ts
git commit -m "feat(rotation): canonical 20-position ring + anchor constants"
```

---

## Task 7: Rotation algorithm (TDD)

**Files:**
- Create: `tests/rotation/algorithm.test.ts`, `lib/rotation/algorithm.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/rotation/algorithm.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { assignment } from "../../lib/rotation/algorithm";

describe("assignment(slot, year, month)", () => {
  it("anchor: slot 1 in June 2026 → I Ś", () => {
    expect(assignment(1, 2026, 6).short).toBe("I Ś");
  });

  it("anchor: slot 2 in June 2026 → II Ś", () => {
    expect(assignment(2, 2026, 6).short).toBe("II Ś");
  });

  it("anchor: slot 20 in June 2026 → V R", () => {
    expect(assignment(20, 2026, 6).short).toBe("V R");
  });

  it("July 2026: slot 1 advances to II Ś", () => {
    expect(assignment(1, 2026, 7).short).toBe("II Ś");
  });

  it("July 2026: slot 20 wraps from V R → I Ś", () => {
    expect(assignment(20, 2026, 7).short).toBe("I Ś");
  });

  it("June 2027 (12 months later): slot 1 → III CH", () => {
    expect(assignment(1, 2027, 6).short).toBe("III CH");
  });

  it("past month: May 2026 (1 month before anchor): slot 1 → V R", () => {
    expect(assignment(1, 2026, 5).short).toBe("V R");
  });

  it("far past: June 2025 (12 months before): slot 1 → ?", () => {
    // (0 + (-12)) % 20 = -12 → +20 = 8 → RING[8] = IV B
    expect(assignment(1, 2025, 6).short).toBe("IV B");
  });

  it("each month all 20 mysteries are covered exactly once", () => {
    const month = { year: 2026, m: 6 };
    const seen = new Set<string>();
    for (let s = 1; s <= 20; s++) seen.add(assignment(s, month.year, month.m).short);
    expect(seen.size).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test:run tests/rotation/algorithm.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement minimal algorithm**

Create `lib/rotation/algorithm.ts`:

```ts
import { RING, ANCHOR_YEAR, ANCHOR_MONTH, type RingEntry } from "./ring";

export function assignment(slot: number, year: number, month: number): RingEntry {
  if (slot < 1 || slot > 20) throw new Error(`slot out of range: ${slot}`);
  if (month < 1 || month > 12) throw new Error(`month out of range: ${month}`);

  const monthsSinceAnchor = (year - ANCHOR_YEAR) * 12 + (month - ANCHOR_MONTH);
  const raw = (slot - 1) + monthsSinceAnchor;
  const idx = ((raw % 20) + 20) % 20; // safe modulo for negatives
  return RING[idx];
}
```

- [ ] **Step 4: Run tests**

Run: `bun run test:run tests/rotation/algorithm.test.ts`
Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/rotation/algorithm.ts tests/rotation/algorithm.test.ts
git commit -m "feat(rotation): assignment(slot, year, month) with full test coverage"
```

---

## Task 8: SMS message format (TDD)

**Files:**
- Create: `tests/rotation/format.test.ts`, `lib/rotation/format.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/rotation/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatSmsBody } from "../../lib/rotation/format";

describe("formatSmsBody", () => {
  it("formats June assignment", () => {
    expect(formatSmsBody(1, 2026, 6)).toBe(
      "Tajemnica na czerwiec: I Światła. Szczęść Boże.",
    );
  });

  it("formats December assignment", () => {
    // assignment(20, 2026, 12) — 6 months past anchor → idx (19+6)%20 = 5 → I B
    expect(formatSmsBody(20, 2026, 12)).toBe(
      "Tajemnica na grudzień: I Bolesna. Szczęść Boże.",
    );
  });

  it("body fits in one UCS-2 SMS segment (≤70 chars)", () => {
    const body = formatSmsBody(1, 2027, 9);
    expect(body.length).toBeLessThanOrEqual(70);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun run test:run tests/rotation/format.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `lib/rotation/format.ts`:

```ts
import { assignment } from "./algorithm";
import { MONTHS_PL, TAJEMNICE_LONG } from "../i18n/pl";

export function formatSmsBody(slot: number, year: number, month: number): string {
  const entry = assignment(slot, year, month);
  const monthName = MONTHS_PL[month - 1];
  const longName = TAJEMNICE_LONG[entry.group];
  return `Tajemnica na ${monthName}: ${entry.roman} ${longName}. Szczęść Boże.`;
}
```

- [ ] **Step 4: Run tests**

Run: `bun run test:run tests/rotation/format.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/rotation/format.ts tests/rotation/format.test.ts
git commit -m "feat(rotation): formatSmsBody Polish template"
```

---

## Task 9: Phone normalization (TDD)

**Files:**
- Create: `tests/phone/normalize.test.ts`, `lib/phone/normalize.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/phone/normalize.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizePhone, NormalizationError } from "../../lib/phone/normalize";

describe("normalizePhone", () => {
  it("accepts already-canonical E.164", () => {
    expect(normalizePhone("+48123456789")).toBe("+48123456789");
  });

  it("accepts Polish number with spaces", () => {
    expect(normalizePhone("123 456 789")).toBe("+48123456789");
  });

  it("accepts Polish number with hyphens and parens", () => {
    expect(normalizePhone("+48 (12) 345-67-89")).toBe("+48123456789");
  });

  it("accepts plain 9-digit Polish mobile", () => {
    expect(normalizePhone("501234567")).toBe("+48501234567");
  });

  it("rejects too-short numbers", () => {
    expect(() => normalizePhone("12345")).toThrow(NormalizationError);
  });

  it("rejects nonsense", () => {
    expect(() => normalizePhone("not a phone")).toThrow(NormalizationError);
  });
});
```

- [ ] **Step 2: Run test → expect failure**

Run: `bun run test:run tests/phone/normalize.test.ts`

- [ ] **Step 3: Implement**

Create `lib/phone/normalize.ts`:

```ts
import { parsePhoneNumberFromString } from "libphonenumber-js";

export class NormalizationError extends Error {}

export function normalizePhone(input: string, defaultCountry: "PL" = "PL"): string {
  const trimmed = input.trim();
  if (!trimmed) throw new NormalizationError("empty");
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) throw new NormalizationError(`invalid: ${input}`);
  return parsed.number; // E.164
}
```

- [ ] **Step 4: Run tests**

Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/phone/normalize.ts tests/phone/normalize.test.ts
git commit -m "feat(phone): normalizePhone to E.164 with PL default"
```

---

## Task 10: Database schema (Drizzle)

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/client.ts`, `drizzle.config.ts`, `.env.example`

- [ ] **Step 1: Write the schema**

Create `lib/db/schema.ts`:

```ts
import {
  pgTable, integer, text, timestamp, boolean, serial, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const members = pgTable("members", {
  slot: integer("slot").primaryKey(),
  name: text("name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slotRange: check("slot_range", sql`${t.slot} BETWEEN 1 AND 20`),
}));

export const sendRuns = pgTable("send_runs", {
  id: serial("id").primaryKey(),
  firedAt: timestamp("fired_at", { withTimezone: true }).notNull(),
  targetYear: integer("target_year").notNull(),
  targetMonth: integer("target_month").notNull(),
  status: text("status").notNull(), // success | partial_failure | fatal_error | paused | in_progress
  totalIntended: integer("total_intended").notNull(),
  totalSentOk: integer("total_sent_ok").notNull(),
  totalFailed: integer("total_failed").notNull(),
  notes: text("notes"),
}, (t) => ({
  monthRange: check("month_range", sql`${t.targetMonth} BETWEEN 1 AND 12`),
}));

export const sendResults = pgTable("send_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => sendRuns.id, { onDelete: "cascade" }),
  slot: integer("slot").notNull(),
  memberName: text("member_name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  messageBody: text("message_body").notNull(),
  twilioSid: text("twilio_sid"),
  status: text("status").notNull(), // queued | sent | delivered | failed | undelivered
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  paused: boolean("paused").notNull().default(false),
  passwordHash: text("password_hash"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  singleRow: check("single_row", sql`${t.id} = 1`),
}));
```

- [ ] **Step 2: Drizzle client**

Create `lib/db/client.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = postgres(url, { prepare: false });
export const db = drizzle(client, { schema });
```

- [ ] **Step 3: Drizzle config**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 4: Document env vars**

Create `.env.example`:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+15551234567
DAD_PHONE_NUMBER=+48...
SESSION_SECRET=replace-with-32-byte-hex
APP_BASE_URL=http://localhost:3000
CRON_SECRET=replace-with-random-string
```

- [ ] **Step 5: Generate initial migration**

```bash
bun run db:generate
```

Verify a `drizzle/0000_*.sql` file exists.

- [ ] **Step 6: Commit**

```bash
git add lib/db/ drizzle.config.ts .env.example drizzle/
git commit -m "feat(db): drizzle schema for members, send_runs, send_results, settings"
```

---

## Task 11: Migration runner script

**Files:**
- Create: `scripts/migrate.ts`

- [ ] **Step 1: Write script**

Create `scripts/migrate.ts`:

```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const sql = postgres(url, { max: 1 });
const db = drizzle(sql);

await migrate(db, { migrationsFolder: "./drizzle" });
await sql.end();
console.log("migrations complete");
```

- [ ] **Step 2: Add dotenv**

```bash
bun add -d dotenv
```

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate.ts package.json bun.lock
git commit -m "feat(db): migration runner script"
```

---

## Task 12: Auth — password hashing (TDD)

**Files:**
- Create: `tests/auth/password.test.ts`, `lib/auth/password.ts`

- [ ] **Step 1: Write tests**

Create `tests/auth/password.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../lib/auth/password";

describe("password", () => {
  it("verifies a correctly-hashed password", async () => {
    const h = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", h)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const h = await hashPassword("hunter2");
    expect(await verifyPassword("not-it", h)).toBe(false);
  });

  it("rejects empty password", async () => {
    expect(() => hashPassword("")).toThrow();
  });
});
```

- [ ] **Step 2: Run → expect FAIL**

- [ ] **Step 3: Implement**

Create `lib/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 4) throw new Error("password too short");
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Run tests**

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/password.ts tests/auth/password.test.ts
git commit -m "feat(auth): bcrypt hash/verify"
```

---

## Task 13: Auth — session cookies

**Files:**
- Create: `lib/auth/session.ts`

- [ ] **Step 1: Implement signed-cookie session**

Create `lib/auth/session.ts`:

```ts
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "tajemniczka_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be ≥32 chars");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function createSession() {
  const issued = Date.now().toString();
  const sig = sign(issued);
  const value = `${issued}.${sig}`;
  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  if (!c) return false;
  const [issued, sig] = c.split(".");
  if (!issued || !sig) return false;
  const expected = sign(issued);
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
  const age = Date.now() - Number(issued);
  return age < MAX_AGE * 1000;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth/session.ts
git commit -m "feat(auth): signed-cookie session (HMAC, 30-day)"
```

---

## Task 14: Auth — Next.js middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write middleware**

Create `middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "tajemniczka_session";
const PUBLIC_PATHS = ["/login", "/api/twilio/webhook", "/api/cron/send", "/api/cron/evaluate"];

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
  } catch { return false; }
  return Date.now() - Number(issued) < 30 * 24 * 60 * 60 * 1000;
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
```

> **Note:** Cron routes are public but secured separately by `CRON_SECRET` header check inside the handler (see Tasks 21–22). Twilio webhook is public but verified via Twilio signature (Task 23).

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): next.js middleware gating all routes"
```

---

## Task 15: Login page + action

**Files:**
- Create: `app/login/page.tsx`, `app/login/actions.ts`

- [ ] **Step 1: Server action**

Create `app/login/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

// In-memory rate limiter (sufficient for single-instance hosting).
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW = 15 * 60 * 1000;
const LIMIT = 5;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (a.count >= LIMIT) return false;
  a.count++;
  return true;
}

export async function loginAction(_: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const ip = "shared"; // Vercel headers can refine; v1 keeps simple
  if (!rateLimit(ip)) return { error: "rate" as const };

  const row = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  const hash = row[0]?.passwordHash;
  if (!hash) return { error: "invalid" as const };
  const ok = await verifyPassword(password, hash);
  if (!ok) return { error: "invalid" as const };

  await createSession();
  redirect("/");
}
```

- [ ] **Step 2: Login page**

Create `app/login/page.tsx`:

```tsx
"use client";
import { useFormState } from "react-dom";
import { loginAction } from "./actions";
import { T } from "@/lib/i18n/pl";

export default function LoginPage() {
  const [state, action] = useFormState(loginAction, null);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form action={action} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">{T.login.title}</h1>
        <label className="block">
          <span className="text-sm text-slate-700">{T.login.passwordLabel}</span>
          <input
            type="password"
            name="password"
            autoFocus
            className="mt-1 block w-full rounded border-slate-300 p-3 text-base"
            required
          />
        </label>
        {state?.error === "invalid" && (
          <p className="text-sm text-red-600">{T.login.invalid}</p>
        )}
        {state?.error === "rate" && (
          <p className="text-sm text-red-600">{T.login.rateLimited}</p>
        )}
        <button className="w-full rounded bg-slate-900 text-white p-3 text-base">
          {T.login.submit}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Add `@/` path alias to tsconfig**

In `tsconfig.json`, ensure `compilerOptions.paths` contains:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

- [ ] **Step 4: Logout route**

Create `app/logout/route.ts`:

```ts
import { destroySession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function POST() {
  await destroySession();
  redirect("/login");
}
```

- [ ] **Step 5: Commit**

```bash
git add app/login/ app/logout/ tsconfig.json
git commit -m "feat(auth): login page, server action, logout, rate limit"
```

---

## Task 16: Members CRUD — server actions

**Files:**
- Create: `app/czlonkowie/actions.ts`

- [ ] **Step 1: Write actions**

Create `app/czlonkowie/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { normalizePhone, NormalizationError } from "@/lib/phone/normalize";

export type MemberFormState = { error?: string } | null;

function validateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("nameRequired");
  return trimmed;
}

export async function upsertMember(slot: number, formData: FormData): Promise<MemberFormState> {
  if (slot < 1 || slot > 20) return { error: "invalidSlot" };
  let name: string;
  let phone: string;
  try {
    name = validateName(String(formData.get("name") ?? ""));
  } catch {
    return { error: "nameRequired" };
  }
  try {
    phone = normalizePhone(String(formData.get("phone") ?? ""));
  } catch (e) {
    if (e instanceof NormalizationError) return { error: "invalidPhone" };
    throw e;
  }
  await db.insert(members).values({ slot, name, phoneE164: phone })
    .onConflictDoUpdate({
      target: members.slot,
      set: { name, phoneE164: phone, updatedAt: new Date() },
    });
  revalidatePath("/czlonkowie");
  revalidatePath("/");
  return null;
}

export async function deleteMember(slot: number): Promise<void> {
  await db.delete(members).where(eq(members.slot, slot));
  revalidatePath("/czlonkowie");
  revalidatePath("/");
}
```

- [ ] **Step 2: Commit**

```bash
git add app/czlonkowie/actions.ts
git commit -m "feat(members): upsert + delete server actions with phone normalization"
```

---

## Task 17: Members CRUD — UI

**Files:**
- Create: `app/czlonkowie/page.tsx`, `app/czlonkowie/[slot]/page.tsx`, `components/MemberRow.tsx`

- [ ] **Step 1: List page**

Create `app/czlonkowie/page.tsx`:

```tsx
import Link from "next/link";
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const rows = await db.select().from(members);
  const bySlot = new Map(rows.map((r) => [r.slot, r]));

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{T.members.title}</h1>
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const m = bySlot.get(slot);
          return (
            <li key={slot} className="flex items-center justify-between gap-3 p-3">
              <span className="font-mono w-8 text-slate-500">{slot}</span>
              <span className="flex-1">{m?.name ?? <em className="text-slate-400">{T.members.add}</em>}</span>
              <Link href={`/czlonkowie/${slot}`} className="text-blue-700 underline text-sm">
                {m ? "Edytuj" : T.members.add}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Edit page**

Create `app/czlonkowie/[slot]/page.tsx`:

```tsx
import { db } from "@/lib/db/client";
import { members } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { upsertMember, deleteMember } from "../actions";
import { T } from "@/lib/i18n/pl";
import { redirect } from "next/navigation";

export default async function EditMemberPage({ params }: { params: Promise<{ slot: string }> }) {
  const { slot: slotStr } = await params;
  const slot = Number(slotStr);
  const row = (await db.select().from(members).where(eq(members.slot, slot)).limit(1))[0];

  async function save(formData: FormData) {
    "use server";
    const result = await upsertMember(slot, formData);
    if (!result) redirect("/czlonkowie");
    return result;
  }

  async function remove() {
    "use server";
    await deleteMember(slot);
    redirect("/czlonkowie");
  }

  return (
    <main className="p-4 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Slot {slot}</h1>
      <form action={save} className="space-y-4">
        <label className="block">
          <span className="text-sm">{T.members.name}</span>
          <input
            name="name"
            defaultValue={row?.name ?? ""}
            className="mt-1 block w-full rounded border-slate-300 p-3"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm">{T.members.phone}</span>
          <input
            name="phone"
            defaultValue={row?.phoneE164 ?? ""}
            inputMode="tel"
            placeholder="+48 ..."
            className="mt-1 block w-full rounded border-slate-300 p-3"
            required
          />
        </label>
        <button className="rounded bg-slate-900 text-white p-3 w-full">{T.members.save}</button>
      </form>
      {row && (
        <form action={remove}>
          <button className="text-red-600 underline text-sm">{T.members.remove}</button>
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/czlonkowie/
git commit -m "feat(members): list + edit pages"
```

---

## Task 18: Tablica — monthly view

**Files:**
- Create: `app/page.tsx`, `components/MonthSwitcher.tsx`

- [ ] **Step 1: Month switcher component**

Create `components/MonthSwitcher.tsx`:

```tsx
import Link from "next/link";
import { T } from "@/lib/i18n/pl";

export function MonthSwitcher({ year, month }: { year: number; month: number }) {
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return (
    <nav className="flex items-center justify-between text-sm py-3">
      <Link href={`/?y=${prev.y}&m=${prev.m}`} className="text-blue-700">←</Link>
      <span className="font-semibold">{T.monthLabel(year, month)}</span>
      <Link href={`/?y=${next.y}&m=${next.m}`} className="text-blue-700">→</Link>
    </nav>
  );
}
```

- [ ] **Step 2: Tablica page**

Replace `app/page.tsx`:

```tsx
import { db } from "@/lib/db/client";
import { members, sendRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { assignment } from "@/lib/rotation/algorithm";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function HomePage(props: { searchParams: Promise<{ y?: string; m?: string }> }) {
  const sp = await props.searchParams;
  const now = new Date();
  const year = sp.y ? Number(sp.y) : now.getFullYear();
  const month = sp.m ? Number(sp.m) : now.getMonth() + 1;

  const memberRows = await db.select().from(members);
  const bySlot = new Map(memberRows.map((m) => [m.slot, m]));

  const lastRun = (await db.select().from(sendRuns).orderBy(desc(sendRuns.firedAt)).limit(1))[0];

  return (
    <main className="p-4 max-w-xl mx-auto">
      <MonthSwitcher year={year} month={month} />
      <ol className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((slot) => {
          const tj = assignment(slot, year, month);
          const m = bySlot.get(slot);
          return (
            <li key={slot} className="flex items-center gap-3 p-3 text-base">
              <span className="font-mono w-8 text-slate-500">{slot}</span>
              <span className="flex-1">
                {m ? m.name : <em className="text-slate-400">{T.vacant}</em>}
              </span>
              <span className="font-semibold">{tj.short}</span>
            </li>
          );
        })}
      </ol>
      {lastRun && (
        <p className="text-sm text-slate-600 mt-4">
          Ostatnia wysyłka:{" "}
          <span className={lastRun.status === "success" ? "text-green-700" : "text-red-700"}>
            {T.history.statuses[lastRun.status as keyof typeof T.history.statuses] ?? lastRun.status}
          </span>{" "}
          ({lastRun.firedAt.toLocaleDateString("pl-PL")})
        </p>
      )}
    </main>
  );
}
```

> **Note:** the "Pokaż numery" toggle is a v1.1 enhancement — to keep this task tight we ship the basic table first. See Task 30 for the toggle.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx components/MonthSwitcher.tsx
git commit -m "feat(tablica): monthly assignment view with month navigation"
```

---

## Task 19: Twilio client

**Files:**
- Create: `lib/sms/twilio-client.ts`

- [ ] **Step 1: Wrap Twilio SDK**

Create `lib/sms/twilio-client.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/sms/twilio-client.ts
git commit -m "feat(sms): twilio client wrapper"
```

---

## Task 20: send-monthly logic

**Files:**
- Create: `lib/sms/send-monthly.ts`

- [ ] **Step 1: Implement**

Create `lib/sms/send-monthly.ts`:

```ts
import { db } from "@/lib/db/client";
import { members, sendRuns, sendResults, settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatSmsBody } from "@/lib/rotation/format";
import { twilioClient, fromNumber, statusCallbackUrl } from "./twilio-client";

export async function runMonthlySend(targetYear: number, targetMonth: number): Promise<{ runId: number; pausedSkipped: boolean }> {
  const cfg = (await db.select().from(settings).where(eq(settings.id, 1)).limit(1))[0];
  if (cfg?.paused) {
    const [run] = await db.insert(sendRuns).values({
      firedAt: new Date(),
      targetYear, targetMonth,
      status: "paused",
      totalIntended: 0, totalSentOk: 0, totalFailed: 0,
      notes: "settings.paused = true",
    }).returning({ id: sendRuns.id });
    return { runId: run.id, pausedSkipped: true };
  }

  const memberRows = await db.select().from(members);
  const intended = memberRows.length;

  const [run] = await db.insert(sendRuns).values({
    firedAt: new Date(),
    targetYear, targetMonth,
    status: "in_progress",
    totalIntended: intended, totalSentOk: 0, totalFailed: 0,
  }).returning({ id: sendRuns.id });

  const tw = twilioClient();
  for (const m of memberRows) {
    const body = formatSmsBody(m.slot, targetYear, targetMonth);
    const [resultRow] = await db.insert(sendResults).values({
      runId: run.id,
      slot: m.slot,
      memberName: m.name,
      phoneE164: m.phoneE164,
      messageBody: body,
      status: "queued",
    }).returning({ id: sendResults.id });
    try {
      const msg = await tw.messages.create({
        to: m.phoneE164,
        from: fromNumber(),
        body,
        statusCallback: statusCallbackUrl(),
      });
      await db.update(sendResults).set({
        twilioSid: msg.sid,
        status: "sent",
        updatedAt: new Date(),
      }).where(eq(sendResults.id, resultRow.id));
    } catch (e: any) {
      await db.update(sendResults).set({
        status: "failed",
        errorCode: e?.code ? String(e.code) : null,
        errorMessage: e?.message ?? "unknown",
        updatedAt: new Date(),
      }).where(eq(sendResults.id, resultRow.id));
    }
  }

  return { runId: run.id, pausedSkipped: false };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sms/send-monthly.ts
git commit -m "feat(sms): runMonthlySend — iterates members, calls twilio, logs to db"
```

---

## Task 21: evaluate-run logic

**Files:**
- Create: `lib/sms/evaluate-run.ts`

- [ ] **Step 1: Implement**

Create `lib/sms/evaluate-run.ts`:

```ts
import { db } from "@/lib/db/client";
import { sendRuns, sendResults } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { twilioClient, fromNumber } from "./twilio-client";
import { T } from "@/lib/i18n/pl";

export async function evaluateRun(runId: number): Promise<void> {
  const results = await db.select().from(sendResults).where(eq(sendResults.runId, runId));
  if (results.length === 0) return;

  const failed = results.filter((r) => r.status === "failed" || r.status === "undelivered");
  const ok = results.filter((r) => r.status === "delivered" || r.status === "sent");
  const status = failed.length === 0 ? "success" : "partial_failure";

  await db.update(sendRuns).set({
    status,
    totalSentOk: ok.length,
    totalFailed: failed.length,
  }).where(eq(sendRuns.id, runId));

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
```

- [ ] **Step 2: Commit**

```bash
git add lib/sms/evaluate-run.ts
git commit -m "feat(sms): evaluateRun aggregates statuses + notifies dad on failure"
```

---

## Task 22: Cron route — /api/cron/send

**Files:**
- Create: `app/api/cron/send/route.ts`

- [ ] **Step 1: Implement**

Create `app/api/cron/send/route.ts`:

```ts
import { NextResponse } from "next/server";
import { nowInWarsaw, isLastDayOfMonth, nextDayMonthYear } from "@/lib/tz";
import { runMonthlySend } from "@/lib/sms/send-monthly";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = nowInWarsaw();
  if (!isLastDayOfMonth(now)) {
    return NextResponse.json({ skipped: "not last day", now });
  }
  const target = nextDayMonthYear(now);
  const result = await runMonthlySend(target.year, target.month);
  return NextResponse.json({ ok: true, ...result, target });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/send/route.ts
git commit -m "feat(cron): /api/cron/send — fires monthly on last day"
```

---

## Task 23: Cron route — /api/cron/evaluate

**Files:**
- Create: `app/api/cron/evaluate/route.ts`

- [ ] **Step 1: Implement**

Create `app/api/cron/evaluate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sendRuns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { evaluateRun } from "@/lib/sms/evaluate-run";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const recent = (await db.select().from(sendRuns)
    .where(eq(sendRuns.status, "in_progress"))
    .orderBy(desc(sendRuns.firedAt))
    .limit(1))[0];
  if (!recent) return NextResponse.json({ skipped: "no in_progress run" });
  await evaluateRun(recent.id);
  return NextResponse.json({ ok: true, runId: recent.id });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/evaluate/route.ts
git commit -m "feat(cron): /api/cron/evaluate — finalizes run + notifies dad"
```

---

## Task 24: Twilio webhook

**Files:**
- Create: `app/api/twilio/webhook/route.ts`

- [ ] **Step 1: Implement signature verification + status update**

Create `app/api/twilio/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/db/client";
import { sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const url = `${process.env.APP_BASE_URL}/api/twilio/webhook`;
  const formText = await req.text();
  const params = Object.fromEntries(new URLSearchParams(formText).entries());

  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params,
  );
  if (!valid) return NextResponse.json({ error: "bad signature" }, { status: 403 });

  const sid = params.MessageSid;
  const status = params.MessageStatus;
  if (!sid || !status) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const allowed = ["queued", "sent", "delivered", "failed", "undelivered"];
  if (!allowed.includes(status)) return NextResponse.json({ ignored: status });

  await db.update(sendResults).set({
    status,
    errorCode: params.ErrorCode ?? null,
    errorMessage: params.ErrorMessage ?? null,
    updatedAt: new Date(),
  }).where(eq(sendResults.twilioSid, sid));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/twilio/webhook/route.ts
git commit -m "feat(sms): twilio status webhook with signature verification"
```

---

## Task 25: vercel.json — cron schedule

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Write config**

Create `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/send",     "schedule": "0 7 * * *" },
    { "path": "/api/cron/evaluate", "schedule": "5 7 * * *" }
  ]
}
```

> **Note:** Vercel cron runs in **UTC**. 09:00 Europe/Warsaw = 07:00 UTC during winter (CET) **and** 07:00 UTC during summer (CEST is UTC+2 → 09:00 Warsaw = 07:00 UTC). Wait — that's wrong. CET is UTC+1 (winter), CEST is UTC+2 (summer). So 09:00 Warsaw = 08:00 UTC in winter, 07:00 UTC in summer. **DST drift means the actual local-time send floats by 1 hour.**
>
> This is acceptable for v1 (members read SMS sometime in the morning either way), and Vercel cron does not support TZ-aware schedules. If exact 09:00 local is later required, the workaround is two crons (one each for CET/CEST windows) with a runtime check, OR use a 3rd-party scheduler like Inngest. **For v1, settle for "around 09:00 Warsaw."** Update this comment if priorities change.

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: vercel cron schedule (07:00 + 07:05 UTC, ~09:00 Warsaw)"
```

---

## Task 26: Settings — page + actions

**Files:**
- Create: `app/ustawienia/actions.ts`, `app/ustawienia/page.tsx`

- [ ] **Step 1: Actions**

Create `app/ustawienia/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { twilioClient, fromNumber } from "@/lib/sms/twilio-client";
import { T } from "@/lib/i18n/pl";

export async function setPaused(paused: boolean): Promise<void> {
  await db.update(settings).set({ paused, updatedAt: new Date() }).where(eq(settings.id, 1));
  revalidatePath("/ustawienia");
}

export async function sendTestSms(): Promise<{ ok: boolean; error?: string }> {
  const dad = process.env.DAD_PHONE_NUMBER;
  if (!dad) return { ok: false, error: "DAD_PHONE_NUMBER not set" };
  try {
    await twilioClient().messages.create({ to: dad, from: fromNumber(), body: T.settings.testBody });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "unknown" };
  }
}

export async function changePassword(formData: FormData): Promise<{ error?: string }> {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm) return { error: "passwordsDoNotMatch" };
  const row = (await db.select().from(settings).where(eq(settings.id, 1)).limit(1))[0];
  if (!row?.passwordHash) return { error: "notConfigured" };
  const ok = await verifyPassword(current, row.passwordHash);
  if (!ok) return { error: "invalid" };
  const hash = await hashPassword(next);
  await db.update(settings).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(settings.id, 1));
  return {};
}
```

- [ ] **Step 2: Page**

Create `app/ustawienia/page.tsx`:

```tsx
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { setPaused, sendTestSms, changePassword } from "./actions";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const row = (await db.select().from(settings).where(eq(settings.id, 1)).limit(1))[0];
  const paused = row?.paused ?? false;

  async function togglePause() { "use server"; await setPaused(!paused); }
  async function test() { "use server"; await sendTestSms(); }

  return (
    <main className="p-4 max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">{T.settings.title}</h1>

      <section className="space-y-2">
        <form action={togglePause}>
          <button className={`w-full rounded p-3 text-white ${paused ? "bg-amber-600" : "bg-slate-900"}`}>
            {T.settings.pauseLabel} {paused ? "✓ włączona" : "wyłączona"}
          </button>
        </form>
        <p className="text-sm text-slate-600">{T.settings.pauseHelp}</p>
      </section>

      <section>
        <form action={test}>
          <button className="w-full rounded bg-blue-700 text-white p-3">{T.settings.sendTest}</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{T.settings.changePassword}</h2>
        <form action={changePassword} className="space-y-3">
          <input name="current" type="password" placeholder={T.settings.currentPassword} className="block w-full rounded border-slate-300 p-3" required />
          <input name="next" type="password" placeholder={T.settings.newPassword} className="block w-full rounded border-slate-300 p-3" required />
          <input name="confirm" type="password" placeholder={T.settings.confirmPassword} className="block w-full rounded border-slate-300 p-3" required />
          <button className="w-full rounded bg-slate-900 text-white p-3">{T.settings.changePassword}</button>
        </form>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/ustawienia/
git commit -m "feat(settings): pause toggle, test SMS, password change"
```

---

## Task 27: Historia — log list & details

**Files:**
- Create: `app/historia/page.tsx`, `app/historia/[runId]/page.tsx`, `app/historia/actions.ts`

- [ ] **Step 1: List**

Create `app/historia/page.tsx`:

```tsx
import Link from "next/link";
import { db } from "@/lib/db/client";
import { sendRuns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const runs = await db.select().from(sendRuns).orderBy(desc(sendRuns.firedAt)).limit(60);

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{T.history.title}</h1>
      {runs.length === 0 && <p className="text-slate-500">{T.history.noRuns}</p>}
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {runs.map((r) => (
          <li key={r.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{T.monthLabel(r.targetYear, r.targetMonth)}</div>
              <div className="text-sm text-slate-600">
                {T.history.statuses[r.status as keyof typeof T.history.statuses] ?? r.status}{" · "}
                {T.history.sentCount(r.totalSentOk, r.totalIntended)}
              </div>
            </div>
            <Link href={`/historia/${r.id}`} className="text-blue-700 underline text-sm">
              {T.history.details}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Detail**

Create `app/historia/[runId]/page.tsx`:

```tsx
import { db } from "@/lib/db/client";
import { sendRuns, sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { retrySend } from "../actions";
import { T } from "@/lib/i18n/pl";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const id = Number(runId);
  const run = (await db.select().from(sendRuns).where(eq(sendRuns.id, id)).limit(1))[0];
  if (!run) return <main className="p-4">Brak takiego biegu.</main>;
  const results = await db.select().from(sendResults).where(eq(sendResults.runId, id));

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">{T.monthLabel(run.targetYear, run.targetMonth)}</h1>
      <p className="text-sm text-slate-600">
        {T.history.statuses[run.status as keyof typeof T.history.statuses] ?? run.status}
      </p>
      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {results.map((r) => (
          <li key={r.id} className="p-3 flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="font-semibold">Slot {r.slot} — {r.memberName}</div>
              <div className="text-xs text-slate-500">{r.phoneE164}</div>
              <div className="text-xs text-slate-500">{r.messageBody}</div>
              {r.errorMessage && <div className="text-xs text-red-700">{r.errorMessage}</div>}
            </div>
            <div className="text-right">
              <span
                className={
                  r.status === "delivered" ? "text-green-700" :
                  r.status === "failed" || r.status === "undelivered" ? "text-red-700" :
                  "text-slate-600"
                }
              >{r.status}</span>
              {(r.status === "failed" || r.status === "undelivered") && (
                <form action={retrySend.bind(null, r.id)}>
                  <button className="block text-xs text-blue-700 underline mt-1">{T.history.retry}</button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Retry action**

Create `app/historia/actions.ts`:

```ts
"use server";

import { db } from "@/lib/db/client";
import { sendResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { twilioClient, fromNumber, statusCallbackUrl } from "@/lib/sms/twilio-client";

export async function retrySend(resultId: number): Promise<void> {
  const r = (await db.select().from(sendResults).where(eq(sendResults.id, resultId)).limit(1))[0];
  if (!r) return;
  try {
    const msg = await twilioClient().messages.create({
      to: r.phoneE164,
      from: fromNumber(),
      body: r.messageBody,
      statusCallback: statusCallbackUrl(),
    });
    await db.update(sendResults).set({
      twilioSid: msg.sid,
      status: "sent",
      errorCode: null,
      errorMessage: null,
      updatedAt: new Date(),
    }).where(eq(sendResults.id, resultId));
  } catch (e: any) {
    await db.update(sendResults).set({
      status: "failed",
      errorMessage: e?.message ?? "unknown",
      updatedAt: new Date(),
    }).where(eq(sendResults.id, resultId));
  }
  revalidatePath(`/historia/${r.runId}`);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/historia/
git commit -m "feat(historia): list, detail page, retry action"
```

---

## Task 28: Top nav + logout button

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add nav to layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isAuthenticated } from "@/lib/auth/session";
import { T } from "@/lib/i18n/pl";

export const metadata: Metadata = {
  title: "Tajemniczka",
  description: "Kółko różańcowe — automatyczne przypomnienia tajemnic",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  return (
    <html lang="pl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {authed && (
          <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
            <nav className="flex items-center justify-between max-w-xl mx-auto p-3 text-sm">
              <div className="flex gap-4">
                <Link href="/">{T.nav.tablica}</Link>
                <Link href="/czlonkowie">{T.nav.czlonkowie}</Link>
                <Link href="/historia">{T.nav.historia}</Link>
                <Link href="/ustawienia">{T.nav.ustawienia}</Link>
              </div>
              <form action="/logout" method="post">
                <button className="text-slate-600 underline">{T.nav.logout}</button>
              </form>
            </nav>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(nav): top nav with logout"
```

---

## Task 29: PWA manifest

**Files:**
- Create: `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`

- [ ] **Step 1: Manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "Tajemniczka",
  "short_name": "Tajemniczka",
  "lang": "pl",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Generate placeholder icons**

```bash
# Use any quick generator or solid-color squares:
# 192x192 and 512x512 PNGs of any solid color, "T" letter optional.
# A minimal approach with ImageMagick:
convert -size 192x192 xc:'#0f172a' -gravity center -fill white -pointsize 120 -annotate 0 'T' public/icon-192.png
convert -size 512x512 xc:'#0f172a' -gravity center -fill white -pointsize 320 -annotate 0 'T' public/icon-512.png
```

If `convert` not available, create empty placeholder PNGs and replace later. The app still works without icons.

- [ ] **Step 3: Commit**

```bash
git add public/
git commit -m "feat(pwa): manifest + placeholder icons"
```

---

## Task 30: "Pokaż numery" toggle on Tablica

**Files:**
- Create: `components/PhoneToggle.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Toggle component**

Create `components/PhoneToggle.tsx`:

```tsx
"use client";
import { useState } from "react";
import { T } from "@/lib/i18n/pl";

export function PhoneToggle({ slots }: { slots: { slot: number; phone: string | null }[] }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow((v) => !v)} className="text-sm text-blue-700 underline mt-3">
        {show ? T.hidePhones : T.showPhones}
      </button>
      {show && (
        <ul className="mt-2 text-sm text-slate-600 space-y-1">
          {slots.map((s) => (
            <li key={s.slot}>Slot {s.slot}: <a href={`tel:${s.phone}`}>{s.phone ?? "—"}</a></li>
          ))}
        </ul>
      )}
    </>
  );
}
```

- [ ] **Step 2: Wire into Tablica**

In `app/page.tsx`, after the `<ol>...`, add:

```tsx
<PhoneToggle slots={Array.from({ length: 20 }, (_, i) => i + 1).map((s) => ({ slot: s, phone: bySlot.get(s)?.phoneE164 ?? null }))} />
```

And import `PhoneToggle` at the top.

- [ ] **Step 3: Commit**

```bash
git add components/PhoneToggle.tsx app/page.tsx
git commit -m "feat(tablica): pokaż numery toggle"
```

---

## Task 31: Seed script

**Files:**
- Create: `scripts/seed-members.ts`, `scripts/members.example.json`

- [ ] **Step 1: Seed script**

Create `scripts/seed-members.ts`:

```ts
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { db } from "../lib/db/client";
import { members } from "../lib/db/schema";
import { normalizePhone } from "../lib/phone/normalize";

interface SeedRow { slot: number; name: string; phone: string }

const path = process.argv[2] ?? "scripts/members.json";
const raw = await readFile(path, "utf-8");
const rows: SeedRow[] = JSON.parse(raw);

for (const r of rows) {
  const phone = normalizePhone(r.phone);
  await db.insert(members).values({ slot: r.slot, name: r.name, phoneE164: phone })
    .onConflictDoUpdate({
      target: members.slot,
      set: { name: r.name, phoneE164: phone, updatedAt: new Date() },
    });
  console.log(`seeded slot ${r.slot}: ${r.name} ${phone}`);
}
console.log("done");
process.exit(0);
```

- [ ] **Step 2: Example file (committed; real `members.json` is gitignored)**

Create `scripts/members.example.json`:

```json
[
  { "slot": 1,  "name": "Wysocki Roman",       "phone": "+48..." },
  { "slot": 2,  "name": "Firlej Krzysztof",    "phone": "+48..." }
]
```

Add to `.gitignore`:

```
scripts/members.json
```

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-members.ts scripts/members.example.json .gitignore
git commit -m "feat(scripts): seed-members from json"
```

---

## Task 32: Set-password script

**Files:**
- Create: `scripts/set-password.ts`

- [ ] **Step 1: Script**

Create `scripts/set-password.ts`:

```ts
import "dotenv/config";
import { db } from "../lib/db/client";
import { settings } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";

const plain = process.argv[2];
if (!plain) {
  console.error("Usage: bun run set-password <plaintext>");
  process.exit(1);
}

const hash = await hashPassword(plain);
const existing = (await db.select().from(settings).where(eq(settings.id, 1)).limit(1))[0];
if (!existing) {
  await db.insert(settings).values({ id: 1, paused: false, passwordHash: hash });
} else {
  await db.update(settings).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(settings.id, 1));
}
console.log("password set");
process.exit(0);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/set-password.ts
git commit -m "feat(scripts): set-password CLI"
```

---

## Task 33: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
# Tajemniczka

Webapp for managing the monthly tajemnica różańcowa rotation in a 20-person kółko różańcowe and automating per-member SMS notifications.

## Setup

1. `bun install`
2. Copy `.env.example` → `.env.local` and fill in values.
3. `bun run db:push` — sync schema to Postgres.
4. `bun run set-password "<password>"` — set dad's login password.
5. Copy `scripts/members.example.json` → `scripts/members.json`, fill the 20 members, then `bun run seed`.

## Local dev

`bun run dev` → http://localhost:3000

## Deploy

Push to GitHub, connect in Vercel. Set env vars there. Vercel runs `db:push` on demand, but for migrations run `bun run db:migrate` against production manually after changes.

## Operations

- Cron: daily 07:00 + 07:05 UTC (≈09:00 Europe/Warsaw, ±1h DST drift). Send fires only when tomorrow is the 1st of a month.
- Failure SMS goes to `DAD_PHONE_NUMBER` only when delivery problems occur.
- Pause toggle in /ustawienia halts the next scheduled run.

See `spec.md` and `qa.md` for full specification.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with setup, deploy, operations"
```

---

## Task 34: Run full test suite + dev sanity check

- [ ] **Step 1: Run tests**

```bash
bun run test:run
```

Expected: all tests passing (rotation algorithm 9, format 3, phone 6, password 3 = **21 passing**).

- [ ] **Step 2: Type check + build**

```bash
bun run build
```

Expected: builds successfully. Investigate any TypeScript errors.

- [ ] **Step 3: Local manual smoke test**

```bash
bun run db:push          # against a local Postgres or Vercel branch
bun run set-password "test"
echo '[{"slot":1,"name":"Test","phone":"+48501234567"}]' > scripts/members.json
bun run seed
bun run dev
```

Open `http://localhost:3000` → redirected to `/login` → enter `test` → see Tablica with slot 1 = Test member, current month assignment.

Click through `/czlonkowie`, `/historia` (empty), `/ustawienia`. All pages load. Logout works.

- [ ] **Step 4: Commit (anything pending)**

```bash
git status
# if anything uncommitted, commit it
```

---

## Task 35: Pre-launch verification checklist (manual)

This task is **operational, not code**. Track as a TODO list to complete before letting the cron fire on June 30 2026.

- [ ] Vercel project provisioned, env vars set (real Twilio creds, real DAD_PHONE_NUMBER).
- [ ] Vercel Postgres provisioned, `bun run db:migrate` run against production.
- [ ] Real password set via `bun run set-password`.
- [ ] Real 20 members seeded (or entered via UI by dad).
- [ ] **Test SMS button works** — fires real SMS to dad's number.
- [ ] **2-recipient dress rehearsal** — manually trigger `/api/cron/send` at any time (with valid `CRON_SECRET` bearer) with a 2-member roster (dad + dev). Verify both SMS arrive, statuses update via webhook, in-app log shows `success`.
- [ ] **Failure case test** — change one phone number to an invalid one (e.g. `+1234567890`), trigger cron, verify failure SMS arrives at dad's phone and historia shows the failure.
- [ ] **Pause toggle test** — toggle pause on, trigger cron, verify run logged as `paused`, no SMS sent.
- [ ] Twilio webhook URL configured in Twilio console (delivery callback) — or rely on the per-message `statusCallback` (already set in code; verify it's reaching the endpoint).
- [ ] Dad's phone has app installed (PWA, Add to Home Screen).
- [ ] Dad has the password.
- [ ] On June 30 2026, monitor the first real cron firing. Be ready to manually intervene.

---

## Self-Review

**Spec coverage check:**

| Spec section | Task(s) implementing it |
|---|---|
| §3 Users | Tasks 12–15 (auth, login) |
| §4 Algorithm | Tasks 6–8 (ring, algorithm, format) — **TDD with 12 tests** |
| §5 Data model | Task 10 (schema) |
| §6.1 Login | Task 15 |
| §6.2 Tablica | Tasks 18, 30 |
| §6.3 Czlonkowie | Tasks 16, 17 |
| §6.4 Historia | Task 27 |
| §6.5 Ustawienia | Task 26 |
| §6.6 Logout | Task 15 (logout route) + Task 28 (button) |
| §7 SMS pipeline | Tasks 19, 20, 21, 22, 23 |
| §7.3 Twilio webhook | Task 24 |
| §7.4 Message format | Task 8 |
| §7.5 Retry | Task 27 |
| §8 Auth | Tasks 12, 13, 14, 15 |
| §9 Stack | Tasks 1, 3 |
| §10 Setup | Tasks 31, 32, 33 |
| §11 Open issues | Task 25 (DST drift acknowledged), Task 35 (pre-launch checklist) |

**No placeholders detected** — every step has actual code or an exact command.

**Type consistency** — verified: `assignment` returns `RingEntry`; consumed correctly in `formatSmsBody`. `normalizePhone` returns string E.164 throughout. `MemberFormState`, `loginAction` return shapes consistent across callers.

**Known approximations to revisit:**
- DST drift on Vercel cron (Task 25 note) — acceptable for v1.
- Rate limiter in login uses in-memory Map; works on a single Vercel function instance per region. Acceptable for 1-user app.
- Twilio webhook URL must be reachable publicly — verify `APP_BASE_URL` is set to the production URL post-deploy.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-10-tajemniczka-mvp.md`.

**Two execution options:**

1. **Subagent-Driven (recommended for plans this size)** — fresh subagent dispatched per task, review between tasks, faster iteration.
2. **Inline Execution** — execute tasks in this session sequentially with periodic checkpoints.

Which approach?

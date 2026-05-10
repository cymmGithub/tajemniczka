# Tajemniczka — Specification

> Web app for managing the monthly tajemnica różańcowa rotation in a 20-person kółko różańcowe and automating per-member SMS notifications.
>
> **Status:** v1 spec, ready for implementation.
> **Companion document:** `qa.md` (detailed Q&A capturing the reasoning behind every decision below).

---

## 1. Context

A *kółko różańcowe* is a 20-person Polish Catholic prayer group. Each member is responsible for one of the 20 *tajemnice różańcowe* (rosary mysteries) per month, and the assignment rotates monthly so that over 20 months every member prays every mystery exactly once.

The mysteries are organized into four groups of five:

| Group | Polish name | Code in paper table |
|---|---|---|
| Tajemnice Światła | Światła | **Ś** |
| Tajemnice Bolesne | Bolesna | **B** |
| Tajemnice Chwalebne | Chwalebna | **CH** |
| Tajemnice Radosne | Radosna | **R** |

Each group has 5 mysteries (`I, II, III, IV, V`), giving 20 total positions in the cycle.

**Current workflow (paper):** The group leader (dad) maintains a hand-drawn 20-row × 12-column table for the year. Each row is a member; each column is a month; each cell is the mystery that member prays that month. Dad manually types and sends ~20 individual SMS messages every month telling each member their next mystery.

**Pain point:** Typing 20 SMS by hand monthly is tedious, error-prone, and not portable to next year's table.

---

## 2. Goal & non-goals

**Goal:** Replace paper table + manual SMS-typing with an automated mobile webapp that:
1. Stores the 20-member roster.
2. Computes each member's mystery for any past or future month.
3. Sends each member their personal SMS reminder automatically on the last day of every month.
4. Notifies dad if (and only if) any SMS fails to deliver.

**Non-goals (v1):**
- Multi-group / multi-tenant support — one kółko, one dad, one app.
- Member self-service (members never log in; they only receive SMS).
- Per-month override of the rotation formula.
- Per-month explicit skip configuration.
- Email or push-notification channels.
- imieniny / nameday / birthday reminders.
- Polish alphanumeric SMS sender ID (deferred — see §11.4).
- Public roster view, embed widgets, anything members can see beyond their own SMS.

---

## 3. Users

| Role | Count | Interaction |
|---|---|---|
| **Dad** (operator) | 1 | Logs into webapp on Android phone, manages roster, monitors history |
| **Members** (recipients) | up to 20 | Receive SMS only, do not interact with the app |
| **Developer** (son) | 1 | Initial setup, hosting, deploys, occasional breakage |

**Dad's profile** (Q1–Q2): Polish-speaking Android user, tech comfort level 3 (online banking, web forms, email). Operates the app himself. UI is Polish-only. PWA installable to home screen.

---

## 4. Rotation algorithm

The rotation is a pure mathematical function of `(slot, year, month)`. No per-month rows are stored.

### 4.1 The 20-position ring

```ts
const RING = [
  "I Ś",  "II Ś",  "III Ś",  "IV Ś",  "V Ś",
  "I B",  "II B",  "III B",  "IV B",  "V B",
  "I CH", "II CH", "III CH", "IV CH", "V CH",
  "I R",  "II R",  "III R",  "IV R",  "V R",
] as const;
```

### 4.2 Anchor

```
ANCHOR_YEAR  = 2026
ANCHOR_MONTH = 6   // June 2026 = month 0 of rotation
                   // At anchor, slot 1 → RING[0] = "I Ś"
```

### 4.3 Function

```ts
function assignment(slot: number, year: number, month: number): string {
  const monthsSinceAnchor = (year - 2026) * 12 + (month - 6);
  const idx = ((slot - 1) + monthsSinceAnchor) % 20;
  // JavaScript % can return negatives for past months — normalize:
  const safe = ((idx % 20) + 20) % 20;
  return RING[safe];
}
```

### 4.4 Sanity checks

| Input | Expected | Reason |
|---|---|---|
| `assignment(1, 2026, 6)` | `"I Ś"` | Anchor: slot 1 = position 0 |
| `assignment(2, 2026, 6)` | `"II Ś"` | Slots offset by their slot number |
| `assignment(20, 2026, 6)` | `"V R"` | Slot 20 = position 19 (last in ring) |
| `assignment(1, 2026, 7)` | `"II Ś"` | One month later, slot 1 advanced 1 step |
| `assignment(20, 2026, 7)` | `"I Ś"` | Slot 20 wrapped from "V R" back to "I Ś" |
| `assignment(1, 2027, 6)` | `"III CH"` | 12 months later: position (0+12)%20 = 12 |

### 4.5 Properties

- **Stateless:** the formula needs no database for its primary output.
- **Coverage:** in any given month, all 20 mysteries are covered exactly once across the 20 slots (slot positions form a complete residue system mod 20).
- **Vacant slots are skipped at SMS time**, but the formula still computes their mystery (useful for displaying gaps in the table).
- **Past months are computable** for as far back as the user wants to look.

---

## 5. Data model

The entire database is small enough to hold ~1 KB of meaningful data after years of operation. Schema designed for **Vercel Postgres**, written here in standard SQL.

### 5.1 `members`

```sql
CREATE TABLE members (
  slot       INTEGER PRIMARY KEY CHECK (slot BETWEEN 1 AND 20),
  name       TEXT    NOT NULL,
  phone_e164 TEXT    NOT NULL,         -- "+48XXXXXXXXX" canonical form
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `slot` is the primary key. Vacant slots are represented by **the row simply not existing** for that slot.
- `name` is a single free-text field — Polish convention typically writes surname first ("Wysocki Roman"). No first/last split.
- Phone numbers are normalized to E.164 on save (UI accepts forgiving input).

### 5.2 `send_runs`

One row per monthly cron execution.

```sql
CREATE TABLE send_runs (
  id              SERIAL PRIMARY KEY,
  fired_at        TIMESTAMPTZ NOT NULL,
  target_year     INTEGER NOT NULL,
  target_month    INTEGER NOT NULL CHECK (target_month BETWEEN 1 AND 12),
  status          TEXT NOT NULL,       -- 'success' | 'partial_failure' | 'fatal_error' | 'paused'
  total_intended  INTEGER NOT NULL,    -- non-vacant slots at firing time
  total_sent_ok   INTEGER NOT NULL,
  total_failed    INTEGER NOT NULL,
  notes           TEXT
);
```

### 5.3 `send_results`

One row per (run, member) — i.e. per individual SMS attempt.

```sql
CREATE TABLE send_results (
  id              SERIAL PRIMARY KEY,
  run_id          INTEGER NOT NULL REFERENCES send_runs(id) ON DELETE CASCADE,
  slot            INTEGER NOT NULL,
  member_name     TEXT NOT NULL,       -- snapshot at send time (members may be edited later)
  phone_e164      TEXT NOT NULL,       -- snapshot
  message_body    TEXT NOT NULL,       -- exact body sent
  twilio_sid      TEXT,                -- Twilio message SID, null if not even submitted
  status          TEXT NOT NULL,       -- 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered'
  error_code      TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_send_results_run ON send_results(run_id);
```

Snapshot fields (`member_name`, `phone_e164`, `message_body`) are intentional — the log must remain accurate even if a member is renamed or removed afterward.

### 5.4 `settings`

Single-row table for global config.

```sql
CREATE TABLE settings (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  paused      BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings (id, paused) VALUES (1, false);
```

The `id = 1` constraint enforces single-row semantics.

### 5.5 What we do *not* store

- No per-month rows for the rotation — derived via §4.
- No member history (deleted members vanish; their past sends remain in `send_results` via name/phone snapshot).
- No audit log of dad's edits — out of scope for v1.

---

## 6. Screens & UX

All UI in **Polish**. Mobile-first (target ~360–414px viewport). Use **rem units, never px** (per developer's standing convention — see Memory).

### 6.1 Login (`/login`)

Single password field, single submit button.
- Label: `Hasło`
- Submit: `Zaloguj`
- On success: set HTTP-only session cookie (30-day expiry), redirect to `/`.
- On failure: show inline error `Nieprawidłowe hasło.` Rate-limit at 5 attempts / 15 min / IP.

### 6.2 Tablica — monthly view (`/`, post-login default)

The home screen. Shows the **current month** by default with a date selector to navigate to past/future months.

Layout:
```
┌─────────────────────────────┐
│ ← Maj 2026     Czerwiec 2026  Lipiec 2026 → │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 1   Wysocki Roman          I Ś          │ │
│ │ 2   Firlej Krzysztof       II Ś         │ │
│ │ 3   (wakat)                III Ś   ⊘    │ │
│ │ ...                                      │ │
│ │ 20  Szczęsny Marian        V R          │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [ Pokaż numery ]                             │
│                                              │
│ Status ostatniego wysłania: ✅ 30.04.2026   │
└─────────────────────────────┘
```

- Each row: `slot # | member name | tajemnica`. Vacant slot renders name as `(wakat)` in muted style and shows a `⊘` icon — derived mystery still displayed (helpful when recruiting: dad can tell a candidate "you'd be on `II Ś` next month").
- `Pokaż numery` toggle reveals phone numbers inline (Q10.5 — hidden by default).
- Header arrows let dad navigate ±1 month at a time. Tap month name → date picker (year + month) to jump farther.
- Footer status badge summarizes the last send run; tap → goes to `/historia`.
- For future months, a `Wyślij teraz (test)` button is **deliberately absent** — sending is automatic and the manual control lives in `/ustawienia`.

### 6.3 Członkowie — member CRUD (`/czlonkowie`)

A 20-row list. Each row shows slot, name, phone, with edit/delete affordance. Vacant slots show a `+ Dodaj członka` action.

Edit form fields (modal or sub-page):
- `Imię i nazwisko` (text)
- `Numer telefonu` (text — accepts any format, normalized on save to E.164)
- `Zapisz` / `Anuluj` / `Usuń członka` (red, with confirm)

Validation:
- Phone must parse to a valid Polish (`+48`) or international E.164 number; show inline error if not. Use `libphonenumber-js`.
- Name must be non-empty.
- Slot reassignment is **not allowed** in v1 (slot is permanent until the row is deleted; if dad wants to move someone, delete + re-add).

### 6.4 Historia — send log (`/historia`)

Reverse chronological list of `send_runs` (full retention, paginated 12/page per Q10.4):

```
Maj 2026   ✅ Wysłano 19/19   30.04.2026 09:00
                              [▼ szczegóły]

Kwiecień 2026  ⚠ 18/19 wysłano   31.03.2026 09:00
                                  Błąd: Wysocki Roman
                              [▼ szczegóły]   [↻ Spróbuj ponownie]
```

Expanded view shows each `send_results` row: status badge, recipient, message body, error code if any. A `Spróbuj ponownie` button retries failed sends for that run individually.

### 6.5 Ustawienia — settings (`/ustawienia`)

Three controls:

1. **Pauza wysyłki** — toggle. When `paused = true`, the cron will skip the next scheduled run and log a `paused` `send_run` row instead of sending. (Q9c.2)

2. **Wyślij testowy SMS** — button. Sends a single hard-coded test SMS to `DAD_PHONE_NUMBER`:
   `Tajemniczka — test wysyłki. Jeśli to widzisz, wszystko działa.`
   Used after deploys / Twilio config changes. (Q9c.3)

3. **Zmień hasło** — simple form (current + new + confirm). Re-hashes and updates env var via the platform — *or*, simpler for v1, persist hash in `settings` table.

### 6.6 Logout

Single link in app header / nav. Clears cookie, redirects to `/login`.

---

## 7. SMS sending pipeline

### 7.1 Trigger

**Vercel Cron Job** runs **daily** at `09:00 Europe/Warsaw`. The handler internally checks whether *tomorrow* is the first day of a month — only then does it execute the send. (Q7a, Q9b)

This avoids parsing brittle "last day of month" cron syntax (which doesn't exist in standard cron) and works correctly across:
- 28-day Februarys (incl. leap years)
- 30-day months
- DST transitions (the cron runs in TZ-aware platform scheduler)

```ts
// pseudocode
export const config = { runtime: 'nodejs', schedule: '0 9 * * *' };

export async function GET() {
  const tomorrow = addDays(nowInWarsaw(), 1);
  if (tomorrow.day !== 1) return new Response('not last day', { status: 200 });
  await runMonthlySend(targetMonth: tomorrow.month, targetYear: tomorrow.year);
  return new Response('done', { status: 200 });
}
```

### 7.2 Run procedure

```
1. Read settings.paused → if true, log run with status='paused', return.
2. Compute target = next month (the one whose 1st is tomorrow).
3. Load all members. For each occupied slot 1..20:
     msg = "Tajemnica na <miesiąc>: <RING[idx]>. Szczęść Boże."
     where idx = ((slot - 1) + monthsSinceAnchor) % 20
4. Insert send_run row (status='in_progress', counts=0).
5. For each (member, msg):
     a. Insert send_results row, status='queued'.
     b. Call Twilio Messages.create({ to, from, body: msg, statusCallback: <webhook> }).
     c. Update send_results with twilio_sid, status='sent' (or 'failed' on submission error).
6. Wait ~3 minutes for Twilio webhook to update final delivery statuses.
   (See §7.3 — webhook updates send_results asynchronously.)
7. Re-read send_results for this run.
8. If any status in ('failed', 'undelivered'):
     send dad a single SMS:
       "Tajemniczka: nie wysłano SMS do: <name1>, <name2>. Sprawdź aplikację."
     Update send_run.status = 'partial_failure'.
   Else: send_run.status = 'success'.
9. Update send_run counts.
```

The 3-minute wait in step 6 can be implemented as either (a) a simple `await sleep(180_000)` if Vercel function timeout permits (Pro tier), or (b) a follow-up cron / queued task on the free tier. For v1 with 20 messages, (a) is simpler — Vercel free tier function timeout is 60s, so use either Vercel Pro, or split into two cron jobs (send at 09:00, evaluate at 09:05). **Confirm Vercel plan before implementing.**

### 7.3 Twilio delivery webhook

Twilio posts delivery status updates to `/api/twilio/webhook`. Handler:

```ts
POST /api/twilio/webhook
- Verify X-Twilio-Signature using TWILIO_AUTH_TOKEN
- Parse MessageSid + MessageStatus + ErrorCode + ErrorMessage
- UPDATE send_results SET status, error_code, error_message
  WHERE twilio_sid = MessageSid
```

This route is public (Twilio cannot send our session cookie) but signature-verified.

### 7.4 Message format

```
Tajemnica na <miesiąc>: <rzymska> <nazwa>. Szczęść Boże.
```

- `<miesiąc>` — Polish month name in nominative/accusative (which coincide for all 12 months — no inflection issues).
- `<rzymska>` — Roman numeral I, II, III, IV, V.
- `<nazwa>` — full Polish adjective: `Bolesna`, `Chwalebna`, `Radosna`, `Światła`.

Length: ~45 chars. Contains Polish diacritics → sent as **UCS-2** (70-char segment), well under one segment.

Polish month name table (for code):
```ts
const MONTHS_PL = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
];
```

The four mystery groups (mapping `RING` element → adjective):
```ts
const TAJEMNICE_LONG: Record<string, string> = {
  'Ś':  'Światła',
  'B':  'Bolesna',
  'CH': 'Chwalebna',
  'R':  'Radosna',
};
```

### 7.5 Error & retry semantics

- A failed Twilio API call (network, auth, rate-limit) → log `send_results.status='failed'`, continue with the next member. Do **not** abort the run.
- A `failed` or `undelivered` final delivery status → flagged in failure SMS to dad and shown in `/historia`.
- Retry button in `/historia` sends individual failed messages on demand. New `send_results` rows are *not* created — instead the existing row is updated (so retries don't pollute counts). Alternative: create new rows linked to the original via `retry_of` column. **Pick one: I recommend updating in place for v1 simplicity.**

---

## 8. Authentication

(Q9a)

- **Single password**, stored as a bcrypt hash in either env var (`ADMIN_PASSWORD_HASH`) or in `settings` table. Latter allows in-app password change; recommend that.
- **Session:** HTTP-only `Secure` cookie, signed JWT or random opaque token, 30-day expiry.
- **Rate limit:** 5 failed login attempts per IP per 15 min — use Vercel KV or in-memory if 1-instance.
- **No password reset UI** for v1. If dad locks himself out, dev resets via DB.
- **All routes except `/login` and `/api/twilio/webhook`** require auth. Webhook is signature-verified instead.

---

## 9. Tech stack

(Q9b)

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Runtime | Node.js (Vercel) |
| Local dev tool | **Bun** (`bun install`, `bun run dev`) — per developer's standing preference |
| Database | **Vercel Postgres** (free tier 256 MB) |
| ORM / query | **Drizzle** (recommended — typed SQL, no migrations magic) or **Kysely** |
| Frontend styling | **Tailwind CSS** with `rem`-based config (per standing convention — never px) |
| Component library | None — small enough to write hand-rolled components |
| SMS provider | **Twilio** (long-code Poland for v1; defer alphanumeric sender ID — see §11.4) |
| Phone validation | `libphonenumber-js` |
| Auth crypto | `bcryptjs` (or `@node-rs/bcrypt`) |
| Date / TZ | `date-fns` + `date-fns-tz` (Europe/Warsaw) |
| Cron | **Vercel Cron Jobs** |
| PWA | `next-pwa` or hand-rolled manifest + service worker |

### Environment variables

```
DATABASE_URL                postgresql://...
TWILIO_ACCOUNT_SID          AC...
TWILIO_AUTH_TOKEN           ...
TWILIO_FROM_NUMBER          +1...
DAD_PHONE_NUMBER            +48...
ADMIN_PASSWORD_HASH         $2a$...   (bcrypt)
SESSION_SECRET              <random 32-byte hex>
APP_BASE_URL                https://tajemniczka.vercel.app  (for Twilio webhook URL)
```

---

## 10. Deployment & initial setup

(Q10.1)

### One-time setup (developer)

1. **Twilio account.** Create, buy a Polish-friendly number (or use any Twilio number that supports SMS to PL — verify pricing). Note: international Twilio numbers sending into PL may show a foreign sender — accept this for v1, see §11.4.
2. **Vercel project.** Connect GitHub repo. Provision Vercel Postgres. Configure env vars.
3. **Database schema.** Run migration to create the four tables (§5).
4. **Seed members.** Provide a one-time admin script (`bun run scripts/seed-members.ts`) that reads a local `members.json` and inserts 20 rows. Dad dictates the names + phones to dev, dev runs the script.
5. **Set initial password.** Run `bun run scripts/set-password.ts <plain>` → updates `settings.password_hash`. Tell dad the password.
6. **Configure Twilio webhook URL.** In Twilio console, point status-callback URLs to `https://<app>/api/twilio/webhook`.
7. **Test.** Use `/ustawienia → Wyślij testowy SMS` to verify a real SMS arrives. Then send a single real SMS to *one* member as a final dress rehearsal before letting the cron run.
8. **Hand off.** Bookmark URL on dad's Android Chrome. Add to home screen (PWA).

### Ongoing (dad)

- Login monthly out of curiosity at most. App runs itself.
- Add/remove member when someone joins or leaves the kółko (every few years).
- Toggle pause if needed.
- Re-trigger failed sends from `/historia` if the failure SMS arrives.

---

## 11. Open issues / pre-launch checklist

### 11.1 Vercel function timeout vs. webhook wait

§7.2 step 6 (the 3-minute wait for Twilio delivery webhooks) exceeds Vercel free-tier function timeout (10s for Hobby plan, 60s for Pro). **Decision needed:** either upgrade to Pro, or split the cron into two jobs (send at 09:00, evaluate at 09:05). The split-cron approach also works on free tier and is more robust.

**Recommendation:** Two cron jobs.
- `cron/send` at 09:00 — performs §7.2 steps 1–5.
- `cron/evaluate` at 09:05 — performs §7.2 steps 7–9.

### 11.2 Polish sender ID

§11.4 Twilio long-codes from outside Poland will display a foreign number to recipients. Older members may distrust this. Alphanumeric sender IDs in Poland require pre-registration (commercial / NIP often required). **Plan:** launch with long-code; if delivery is fine and members aren't confused, leave it. If problems, investigate Twilio's PL alphanumeric registration flow or switch to a Polish provider (SMSAPI, SerwerSMS) — that's a v2 migration.

### 11.3 GDPR

20 phone numbers + names is personal data under GDPR. v1 minimums:
- App is private (single password, member data not exposed publicly).
- A "delete member" button in `/czlonkowie` permanently removes the row (snapshot remains in `send_results` for audit, which is a legitimate-interest record of communications sent).
- Members were told once by dad ("you'll get an SMS each month from this number") — informal consent. If group ever expands beyond friends-of-dad, formalize with a one-line consent statement.

### 11.4 Pre-launch verification

Before letting the first real cron fire (last day of June 2026 — wait, June *is* the anchor month, so first cron fires **30 June 2026**, sending July 2026 assignments):

- [ ] Test SMS button works.
- [ ] Send to **2 real numbers** (dad + dev) via the actual cron logic, manually invoked.
- [ ] Verify webhook updates statuses correctly.
- [ ] Verify `partial_failure` flow by deliberately corrupting one number.
- [ ] Verify pause toggle works.
- [ ] Verify history view shows correct counts.

### 11.5 Heartbeat (deferred to v2)

The "failure SMS to dad" only fires if the cron itself runs. If the cron is silently broken (Vercel issue, code bug, exhausted limits), dad gets nothing. v2: add a Healthchecks.io / UptimeRobot ping from the cron job; if pings stop, dad gets an email. Out of scope for v1.

---

## 12. Out-of-scope / future enhancements

Tracked for posterity, *not* to be built without explicit user request:

- Per-month override (single-instance swap)
- imieniny / nameday SMS (extra channel for nameday wishes)
- Email / web-push notifications
- Public read-only roster (so members can self-check)
- Multi-group support
- Year-end PDF export of the rotation table for printing (some kółka still want paper as backup)
- Dark mode
- English UI

---

## Appendix A — Decision traceability

Every design decision in this spec maps to a Q&A entry in `qa.md`:

| Decision | Source |
|---|---|
| Dad operates app himself | Q1 |
| Android-first, PWA | Q2a |
| Tech-comfort-3 features (login, member CRUD) | Q2b |
| SMS as channel, Twilio as provider | Q3 |
| Slot-based 20-member rotation | Q4 |
| Fully automatic, last-day-of-month send | Q6 |
| 09:00 Europe/Warsaw send time | Q7a |
| Failure-only SMS to dad | Q7b |
| Polish message template `Tajemnica na X: Y Z. Szczęść Boże.` | Q7c |
| Name + phone fields only | Q8b |
| June 2026, slot 1 = I Ś as anchor | Q8c |
| Single-password auth | Q9a |
| Next.js + Vercel | Q9b |
| Manual test SMS button | Q9c.3 |
| No per-month override | Q9c.1 |
| Global pause toggle (no per-month skip) | Q9c.2 |
| Dev seeds initial members | Q10.1 |
| Twilio long-code at launch | Q10.2 |
| Polish-only UI | Q10.3 |
| Full history retention | Q10.4 |
| Phone numbers hidden by default | Q10.5 |

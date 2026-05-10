# Tajemniczka

Polish webapp for managing the monthly tajemnica różańcowa rotation in a 20-person
*kółko różańcowe* and automating per-member SMS notifications via Twilio.

See [`spec.md`](./spec.md) for the full specification and [`qa.md`](./qa.md) for the
Q&A trail behind every design decision.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Drizzle ORM · Vercel Postgres · Twilio · Bun (local dev) · Vitest

## Setup

1. `bun install`
2. Copy `.env.example` → `.env.local`, fill in DB + Twilio + secrets.
3. `bun run db:push` — sync schema to Postgres (or `bun run db:migrate` to apply versioned migrations).
4. `bun run set-password "<password>"` — set dad's login password.
5. Copy `scripts/members.example.json` → `scripts/members.json`, fill 20 members, then `bun run seed`.

## Local dev

```bash
bun run dev
# → http://localhost:3000
```

## Tests

```bash
bun run test:run
```

Pure-logic test coverage: rotation algorithm, SMS formatter, phone normalization, password hashing.

## Deploy

Push to GitHub, connect in Vercel. Set env vars in the Vercel dashboard. Run `bun run db:migrate` against production after schema changes.

## Operations

- **Cron:** Vercel cron at 07:00 UTC + 07:05 UTC daily (≈09:00 Europe/Warsaw, with ±1h DST drift). Send fires only when *tomorrow* is the 1st of a new month.
- **Failure SMS** is sent to `DAD_PHONE_NUMBER` only when at least one delivery fails. Successful runs are silent.
- **Pause toggle** in `/ustawienia` halts the next scheduled run; flip it back to resume — the rotation formula is stateless so paused months are simply skipped.
- **Test SMS button** in `/ustawienia` fires a single SMS to dad's number to verify Twilio config without waiting for the cron.

## Routes

- `/` — Tablica (monthly assignment view)
- `/czlonkowie` — Member list + edit
- `/historia` — Send-run log + per-run detail with retry
- `/ustawienia` — Pause, test SMS, password
- `/login` · `/logout`
- `/api/cron/send` · `/api/cron/evaluate` — Vercel cron entrypoints (require `CRON_SECRET` bearer)
- `/api/twilio/webhook` — Twilio delivery status callback (signature-verified)

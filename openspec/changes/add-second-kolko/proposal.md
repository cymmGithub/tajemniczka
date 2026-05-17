## Why

The app currently models exactly one *kółko różańcowe* — a single 20-person rosary circle whose roster, monthly rotation, SMS dispatch, and history are all assumed to belong to one implicit group. The operator (Przemek's father) actually runs **two** parallel circles and needs to monitor each one's members, monthly assignments, and SMS delivery status from a single app. Without explicit group support, the second circle has no home: rosters would collide on the 20-slot primary key, SMS runs would mix recipients, and history would be unreadable.

This is a small, well-bounded change because it has a single user, no isolation requirements, and a domain where "20 people per circle" is a structural truth of the rosary itself (4 mystery groups × 5 mysteries) rather than a configurable limit. The work is essentially: **partition the existing single-group data by `group_id`, and add a portrait-based picker as the new landing page.**

## What Changes

- **Add `groups` table** — `(id, name, short_label, image_path, anchor_year, anchor_month, paused, created_at, updated_at)`. Seeded with two rows on migration: *Kółko Różańcowe bł. Jerzego Popiełuszki* and *Kółko Różańcowe pod wezwaniem św. Józefa*. Each group owns its own rotation anchor (both start at 2026-06 today, parallel) and its own `paused` flag.
- **Partition existing tables by group** — `members` gains a `group_id` FK and its primary key becomes `(group_id, slot)`; `send_runs` and `send_results` gain `group_id` FKs. The `slot BETWEEN 1 AND 20` CHECK stays — it now applies per-group. Existing data is backfilled with `group_id = 1`.
- **Move `settings.paused` to `groups.paused`** — each circle can be paused independently. The global `settings.passwordHash` stays put (there is still one password for one user).
- **Drop hardcoded rotation anchor constants** — `ANCHOR_YEAR` / `ANCHOR_MONTH` in `lib/rotation/ring.ts` are replaced by per-group values read from the `groups` row. The `assignment()` math is unchanged; the anchor is just passed in instead of imported.
- **New landing page at `/`** — a picker showing both group portraits as large tappable cards. Clicking a portrait routes to `/g/[groupId]/`. The bare `/` route always renders the picker (no cookie-based last-viewed memory; deterministic, simple).
- **Move all in-circle routes under `/g/[groupId]/`** — `/` → `/g/[groupId]/`, `/czlonkowie` → `/g/[groupId]/czlonkowie`, `/czlonkowie/[slot]` → `/g/[groupId]/czlonkowie/[slot]`, `/historia` → `/g/[groupId]/historia`. Per-group settings live at `/g/[groupId]/ustawienia` (paused toggle, group name/image edits). The Masthead inside `/g/[groupId]/` displays the group's small circular portrait + name; tapping the portrait returns to the picker.
- **Split `/ustawienia` into two contexts** — `/ustawienia` (global) keeps only the password-change form. Per-group settings (paused, name, image) move to `/g/[groupId]/ustawienia`. The picker page links to global settings.
- **Make monthly SMS cron group-aware** — `runMonthlySend` runs once per group (or accepts a `groupId` argument), inserting one `send_runs` row per group per month. Each group respects its own `paused` flag independently.
- **Optimize and rename portrait assets** — `public/swiety-jozef-835713239.png` (2.8 MB) downsized and re-encoded to `public/swiety-jozef.webp` (~50 KB target); `public/408fd4869a5f5b3c9343651350b5aff2-3170773221.jpg` renamed to `public/popieluszko.jpg`. Hash-style filenames become stable, semantic names referenced from the seed migration.
- **No change** to: auth/session model (still one global password + signed-timestamp cookie), the rotation algorithm's math, the `/demo` page (stays single-group, frozen), the `/login` page, webhook and cron API endpoints' URLs.
- **BREAKING** at the route level: `/`, `/czlonkowie`, `/czlonkowie/[slot]`, `/historia` no longer exist as in-circle screens. Any external bookmarks pointing to them must be updated. (Bookmarks on `/` still work — they now land on the picker.) Internal links are all rewritten as part of this change.

## Capabilities

### New Capabilities

- `groups`: Defines the multi-circle data model, the picker landing page, the `/g/[groupId]/` routing scheme, and the per-group scoping rules for roster, rotation, SMS dispatch, and history.

### Modified Capabilities

<!-- None — the project has no existing specs in openspec/specs/ yet. Behaviors of roster, rotation, SMS, and history are documented here only insofar as they are scoped per-group; full specs for those domains belong to future proposals. -->

## Impact

- **Database**: New migration `drizzle/0003_groups.sql` (create `groups`, alter `members` / `send_runs` / `send_results`, drop `settings.paused`, seed two rows, backfill `group_id = 1`).
- **Schema source**: `lib/db/schema.ts` gains a `groups` table; existing tables gain `groupId` columns; `members` primary key changes; `settings.paused` removed.
- **Routing & layout**: All existing in-circle pages under `app/` move into `app/g/[groupId]/`. New `app/page.tsx` becomes the picker. `app/ustawienia/page.tsx` is reduced to password-change only.
- **Components**: `Masthead.tsx` gains a group-context variant (small portrait + name, links home). New `GroupCard.tsx` for the picker. No new switcher component — the model is "go home to switch."
- **Rotation**: `lib/rotation/ring.ts` loses the `ANCHOR_*` constants. `lib/rotation/algorithm.ts`'s `assignment()` signature gains an `anchor` argument; all call sites pass the group's stored anchor.
- **SMS**: `lib/sms/send-monthly.ts` takes a `groupId` argument and scopes queries by it. The cron endpoint (`app/api/cron/send/route.ts`) iterates over groups.
- **Middleware**: `middleware.ts` gets one tweak — `/g/[groupId]/...` paths are treated as authed (covered by the default-authed matcher; only `/login`, `/demo`, and webhook/cron paths remain public).
- **Tests**: Rotation algorithm tests adapt to the new `assignment(slot, year, month, anchor)` signature. New tests for group-scoped queries and picker behavior.
- **Assets**: Two portrait images committed to `public/` with stable names; the 2.8 MB PNG re-encoded.
- **No impact** on auth, the SMS provider integration, webhook handling, cron scheduling cadence, or the demo page.

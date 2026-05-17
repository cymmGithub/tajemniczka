## Context

The Tajemniczka app is a Next.js 15 (App Router) + Drizzle + Postgres tool that helps a single operator (Przemek's father) run a *kółko różańcowe* — a Catholic rosary circle of 20 people who together cover all 20 mysteries of the rosary each month, rotating monthly so over a 20-month cycle each member visits every mystery once. The app sends each member a monthly SMS via smsapi.pl telling them which mystery to pray.

Today the app models exactly one circle, with this shape:

```
   members(slot 1..20 PK, name, phone)
   settings(id=1 single-row CHECK, paused, password_hash)
   send_runs(year, month, status, totals)
   send_results(run_id → run, slot, body, ...)

   auth:  one shared password in settings, signed-timestamp cookie
   rotation: ANCHOR_YEAR=2026 / ANCHOR_MONTH=6 hardcoded in ring.ts
   routes: /, /czlonkowie, /czlonkowie/[slot], /historia, /ustawienia
```

The operator actually runs **two** parallel circles: *Kółko Różańcowe bł. Jerzego Popiełuszki* and *Kółko Różańcowe pod wezwaniem św. Józefa*. Both started in June 2026 (same anchor). Both have ~20 members. He wants to monitor both from this app, switching between them on demand.

The constraints that shape the design:
- **One user, one password.** No isolation requirement. This is data partitioning, not multi-tenancy in the security sense.
- **"20" is structural, not configurable.** A rosary has exactly 20 mysteries; both circles will always be 20 people. The CHECK constraint stays.
- **"Don't overcomplicate."** Explicit guidance from the user. Smallest viable change wins ties.

## Goals / Non-Goals

**Goals:**

- Partition all circle-scoped data (`members`, `send_runs`, `send_results`) by `group_id` while keeping the existing single-user auth model untouched.
- Replace the previous root route `/` with a portrait-based picker that makes the choice of circle the explicit landing experience.
- Make the rotation anchor a per-group attribute, not a build-time constant, so future circles with different start months would require zero code change.
- Pause/unpause each circle's monthly SMS independently.
- Optimize and rename portrait assets so they ship at sensible sizes under stable, semantic filenames.

**Non-Goals:**

- Introducing a real `users` table or per-user identity. The app has one user.
- Per-group passwords or any access isolation between groups. Anyone with the password sees everything.
- A header-bar switcher chip inside `/g/[groupId]/...` screens. The model is "go home to switch."
- Making the rotation `RING` (5 numbers × 4 mystery groups) configurable. The rosary has 20 mysteries; that is not a knob.
- Changing the SMS provider integration, the webhook contract, or the cron cadence.
- Migrating the `/demo` page to multi-group. The demo is a marketing/preview surface and stays frozen on Group 1's shape.
- Per-group SMS message templates / branding. Both circles send the same monthly message format.

## Decisions

### Decision 1: Portrait-based picker page at `/`, no separate `/select` route

The picker IS the home page. Bare `/` renders two large tappable portrait cards. No redirect, no cookie-based last-viewed memory, no separate `/select` URL.

**Why:** The portraits are the natural visual identity for each circle and deserve a destination, not a thumbnail in a header chip. Making the picker `/` instead of `/select` avoids inventing a new route name and means the existing login redirect (`redirect("/")` in `app/login/actions.ts`) needs zero changes. Cookie-less behavior matches the user's explicit "don't overcomplicate" guidance.

**Alternatives considered:**
- *Header-chip switcher (no picker page).* Rejected: shrinks the portraits to thumbnails, wastes their visual weight, and doesn't match the operator's flipping-between-groups workflow.
- *Cookie-based last-viewed redirect.* Rejected: introduces hidden state and an edge case (cookie cleared → fall back to what?) for negligible UX gain.
- *Separate `/select` route, with `/` redirecting there.* Rejected: extra indirection with no benefit.

### Decision 2: `/g/[groupId]/` URL prefix for in-circle routes

All circle-scoped routes move under a `[groupId]` dynamic segment. `/g/1/czlonkowie`, `/g/2/historia`, etc.

**Why:** URL-honest — what you see is what you're looking at. Bookmarkable per-circle. Trivially shows in server logs which group an action targeted. The `[groupId]` segment is a single dynamic boundary; everything inside it filters on it. No hidden state.

**Alternatives considered:**
- *Cookie-based current-group with unchanged URLs.* Rejected: hides the multi-group dimension from URLs, makes deep-linking awkward, and was already ruled out by Decision 1's "don't overcomplicate" theme.
- *Query parameter `?g=1`.* Rejected: less Next-idiomatic than dynamic segments, harder to scope a layout to.

### Decision 3: `groups.anchor_year` and `groups.anchor_month` as per-group columns, even though both rows seed with `(2026, 6)`

The rotation anchor moves from `ring.ts` constants into the `groups` table.

**Why:** The constants are a lie if there are two groups — "the anchor" vs "this group's anchor." Even if both anchors coincide today, the math `assignment(slot, year, month, anchor)` is correct for any anchor. Storing per group costs one INT pair per row and a `CHECK (anchor_month BETWEEN 1 AND 12)` constraint, and earns: zero schema change to support a future Group 3 with a different start. The change is small enough to do correctly now.

**Alternatives considered:**
- *Keep `ANCHOR_*` as constants, both groups share them.* Rejected: re-creates the same lie at a smaller scale; locks in a wrong abstraction.
- *Single anchor column on a singleton `rotation_config` table.* Rejected: pure overhead — the anchor belongs to the group, not to a global config.

### Decision 4: Move `settings.paused` to `groups.paused`, keep `settings.password_hash`

`paused` becomes per-group; the password stays single-row global.

**Why:** The user explicitly wants to pause one circle without affecting the other. `password_hash` is global by design — there is one operator. Keeping `settings` as the single-row store for global state means the singleton CHECK (`id = 1`) stays intact, and we don't end up with the password living in a multi-row table that doesn't need to be multi-row.

**Alternatives considered:**
- *Move both `paused` and `password_hash` to a multi-row `groups`-shaped table.* Rejected: forces password duplication or a denormalized "first row wins" pattern. Worse for clarity.
- *Keep `settings.paused` and add `groups.paused` as well.* Rejected: two sources of truth, guaranteed drift.

### Decision 5: Add a denormalized `group_id` to `send_results` (in addition to `send_runs.group_id`)

`send_results` already has a `run_id` FK to `send_runs`, so its group identity is technically derivable. We add `group_id` anyway.

**Why:** `/g/[groupId]/historia` will issue queries like *"show me all SMS messages for Group N over time"*. With a denormalized `group_id`, that's a single-table scan with an index. Without it, every query joins through `send_runs`. The denormalization cost is one integer column; the upside is simpler, faster queries and no risk of forgetting the join. For a table that grows by ~480 rows per year (20 members × 2 groups × 12 months), this is negligible storage.

**Alternatives considered:**
- *Derive group_id via JOIN every time.* Rejected: every history view becomes a two-table query for no real reason.
- *Trigger to maintain `group_id` on `send_results` from `send_runs`.* Rejected: triggers hide logic; we control all insert sites in code.

### Decision 6: Picker page is at `/`, but global settings stay at `/ustawienia`

Global settings (just password change) stay outside the `/g/[groupId]/` tree. Per-group settings (`paused`, `name`, `short_label`, `image_path` edits) live at `/g/[groupId]/ustawienia`.

**Why:** The password is genuinely global; nesting it under any group is misleading. Per-group settings naturally belong with their group's other screens. The picker page links to `/ustawienia` for global tasks; each group's Masthead has an in-group settings link to `/g/[groupId]/ustawienia`. This is a real conceptual split, not URL aesthetics.

**Alternatives considered:**
- *Single `/ustawienia` showing both groups side-by-side.* Rejected by the user (preferred per-group settings inside the per-group tree for consistency).
- *Single `/g/[groupId]/ustawienia` containing the password change too.* Rejected: makes password change accidentally feel "Group 1's password" or duplicates the form on both group's settings pages.

### Decision 7: No in-page group switcher — returning to `/` is the only switch mechanism

Inside `/g/[groupId]/...`, the Masthead shows the active group's portrait + label, clickable to `/`. No second switcher control (no header chip, no dropdown).

**Why:** One concept, one mechanism. The Masthead portrait *is* the home affordance; learning that the portrait is clickable is a one-time cost. Two switching mechanisms would create the "which one do I use?" question for no benefit. Two-group flipping cost: one tap to home + one tap to other group = two taps. Acceptable.

**Alternatives considered:**
- *Header switcher chip alongside the portrait.* Rejected: redundancy, complicates the Masthead layout on mobile, undermines the picker's role as the choosing surface.

### Decision 8: Rename and re-encode portrait assets as part of this change, not a follow-up

The hash-named source files (`408fd4...3170773221.jpg`, `swiety-jozef-835713239.png`) are renamed to `popieluszko.jpg` and `swiety-jozef.webp`. The 2.8 MB PNG is re-encoded to WebP at ~50–100 KB.

**Why:** The seed migration hardcodes `image_path` values. Doing the rename later would require either a second migration or living with hash-named files forever. The size optimization is a perf concern that's easier to fix once, at introduction, than to remember later. Both are mechanical, low-risk steps with no design ambiguity.

**Alternatives considered:**
- *Ship hash-named files as-is, optimize later.* Rejected: 2.8 MB on every picker page load is a real mobile-first regression on a UI that's been carefully polished for mobile. Cost of optimizing now: one `cwebp` command and one `git mv`.
- *Reference assets via Next.js static imports rather than DB paths.* Rejected: would couple `groups.image_path` to compile-time imports, making it hard for the operator to ever swap images via a future settings UI without a code deploy.

## Risks / Trade-offs

- **Risk: Rotation anchor backfill bug** → If the migration accidentally seeds Group 1 or Group 2 with the wrong `anchor_month`, every SMS for that group will state the wrong mystery for the rest of time. *Mitigation:* explicit test (`tests/rotation/`) verifying that `assignment(slot=1, year=2026, month=6, anchor=(2026,6))` returns `RING[0]` for both seeded groups; verify in DB after migration before letting cron fire.

- **Risk: Foreign key migration ordering** → Adding `group_id NOT NULL` to existing tables requires the `groups` table and its seed rows to exist *before* the `ALTER TABLE ... NOT NULL` runs against backfilled rows. *Mitigation:* the migration is a single transactional SQL file with steps strictly ordered: create `groups` → seed rows → add nullable `group_id` columns → backfill `group_id = 1` → add NOT NULL constraints → change `members` PK → drop `settings.paused`. Validate with `drizzle-kit` against a fresh DB before deploy.

- **Risk: Broken external bookmarks** → Anything bookmarked to `/czlonkowie`, `/czlonkowie/[slot]`, or `/historia` returns 404 after this change. *Mitigation:* only one user exists; the user is in the loop on this change. The bare `/` bookmark survives (lands on picker). No external link is realistically affected.

- **Risk: SMS cron sends twice for the same group/month** → If the cron is restructured incorrectly, a retry could insert two `send_runs` for the same `(group_id, year, month)`. *Mitigation:* enforce uniqueness via a `UNIQUE (group_id, target_year, target_month)` constraint on `send_runs` (added in this migration). Existing data may not satisfy this if a prior run was retried — verify by inspecting `send_runs` history before migrating.

- **Risk: Portrait image encoding/size regression** → A poorly-encoded WebP could look ugly at small (40px) circular crop sizes on mobile. *Mitigation:* visually inspect the picker and in-group Masthead on a phone-sized viewport before declaring done.

- **Trade-off: Two settings entry points** → A single `/ustawienia` showing both groups side-by-side would be marginally tidier IA. We chose the split for URL consistency with the rest of the `/g/[groupId]/` tree. The price is one extra link.

- **Trade-off: Denormalized `send_results.group_id`** → Storage slightly wider than strictly necessary; conceptually it must always match `send_runs.group_id` for the linked run. The simplicity-of-querying win is judged worth it.

## Migration Plan

Single drizzle migration file: `drizzle/0003_groups.sql`. All steps in one transaction.

```
BEGIN;

  -- 1. Create groups table
  CREATE TABLE groups (
    id            SERIAL  PRIMARY KEY,
    name          TEXT    NOT NULL,
    short_label   TEXT    NOT NULL,
    image_path    TEXT    NOT NULL,
    anchor_year   INTEGER NOT NULL,
    anchor_month  INTEGER NOT NULL CHECK (anchor_month BETWEEN 1 AND 12),
    paused        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 2. Seed two groups
  INSERT INTO groups (id, name, short_label, image_path, anchor_year, anchor_month) VALUES
    (1, 'Kółko Różańcowe bł. Jerzego Popiełuszki', 'Popiełuszko', '/popieluszko.jpg',     2026, 6),
    (2, 'Kółko Różańcowe pod wezwaniem św. Józefa', 'św. Józef',  '/swiety-jozef.webp',   2026, 6);
  SELECT setval('groups_id_seq', 2);

  -- 3. Add nullable group_id to members, backfill, set NOT NULL, change PK
  ALTER TABLE members  ADD COLUMN group_id INTEGER REFERENCES groups(id);
  UPDATE      members  SET group_id = 1 WHERE group_id IS NULL;
  ALTER TABLE members  ALTER COLUMN group_id SET NOT NULL;
  ALTER TABLE members  DROP CONSTRAINT members_pkey;
  ALTER TABLE members  ADD  CONSTRAINT members_pkey PRIMARY KEY (group_id, slot);

  -- 4. Same pattern for send_runs and send_results
  ALTER TABLE send_runs    ADD COLUMN group_id INTEGER REFERENCES groups(id);
  UPDATE      send_runs    SET group_id = 1;
  ALTER TABLE send_runs    ALTER COLUMN group_id SET NOT NULL;
  ALTER TABLE send_runs    ADD CONSTRAINT send_runs_unique_month
                            UNIQUE (group_id, target_year, target_month);

  ALTER TABLE send_results ADD COLUMN group_id INTEGER REFERENCES groups(id);
  UPDATE      send_results sr SET group_id = (
    SELECT group_id FROM send_runs WHERE id = sr.run_id
  );
  ALTER TABLE send_results ALTER COLUMN group_id SET NOT NULL;

  -- 5. Drop the now-redundant paused column from settings
  ALTER TABLE settings DROP COLUMN paused;

COMMIT;
```

**Application deploy order:**

1. Run migration (assets are committed first so seeded image paths resolve).
2. Deploy the new app build (new routes, new schema in `lib/db/schema.ts`, new SMS cron, etc.).
3. Manually verify by visiting the picker, entering Group 1, entering Group 2, and triggering a paused-group cron via a small one-off script (or simply waiting for the next monthly fire, since the user is a single operator and downtime tolerance is high).

**Rollback strategy:**

The migration is reversible only with explicit data loss in `groups` (and re-creating `settings.paused`). For a single-user, single-server app with a hand-managed Postgres, the practical rollback is: `pg_dump` before migration, restore on failure. No automated down-migration is needed for this scope.

## Open Questions

- **Should `/g/[groupId]/ustawienia` allow editing `image_path`?** The spec says yes (per-group settings include image), but implementing image upload (file handling, validation, storing under `public/` from a server action) is a bigger task. Defer to a future change if needed. For this change, allow editing `name` and `short_label` only; image path is fixed by the seed migration.

- **Does the SMS cron call site need to change?** Currently `app/api/cron/send/route.ts` calls `runMonthlySend(year, month)`. The new shape is `runMonthlySend(year, month, groupId)`. The cron route SHALL iterate over `SELECT id FROM groups` and call once per group. Confirmed approach; flagged as "Open" only insofar as the *exact* iteration shape (sequential vs parallel) is a small implementation choice during execution.

- **Index on `send_results.group_id`?** Likely yes for `/g/[groupId]/historia` queries. The current schema only indexes `provider_message_id`. Adding `CREATE INDEX send_results_group_id_idx ON send_results(group_id, created_at DESC)` is cheap; flag for the implementer to confirm via `EXPLAIN`.

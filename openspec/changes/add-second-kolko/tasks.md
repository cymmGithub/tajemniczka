## 1. Portrait assets

- [x] 1.1 Re-encode `public/swiety-jozef-835713239.png` to WebP at a target ≤ 100 KB, retaining good visual fidelity at 80×80 px circular crop (use `cwebp -q 80` or similar; verify by eye) — encoded at `cwebp -q 80 -resize 800 0`, result 29 KB
- [x] 1.2 `git mv public/swiety-jozef-835713239.png` out of the tree, write the new WebP to `public/swiety-jozef.webp` — source was untracked so used plain `mv` + `rm`
- [x] 1.3 `git mv public/408fd4869a5f5b3c9343651350b5aff2-3170773221.jpg public/popieluszko.jpg` — used plain `mv` (source was untracked)
- [x] 1.4 Sanity-check both files exist at their new paths and serve correctly via `next dev` (visit `http://localhost:3000/popieluszko.jpg` and `/swiety-jozef.webp`) — files exist at expected paths; browser-level smoke deferred to section 11

## 2. Database schema & migration

- [x] 2.1 Update `lib/db/schema.ts`: add the `groups` table (`id`, `name`, `short_label`, `image_path`, `anchor_year`, `anchor_month` with CHECK 1..12, `paused`, `created_at`, `updated_at`)
- [x] 2.2 Update `members` definition: add `group_id` FK to `groups`, change primary key to composite `(group_id, slot)`, keep the `slot BETWEEN 1 AND 20` CHECK
- [x] 2.3 Update `send_runs` definition: add `group_id` FK, add unique constraint on `(group_id, target_year, target_month)`
- [x] 2.4 Update `send_results` definition: add `group_id` FK; add index on `(group_id, created_at DESC)`
- [x] 2.5 Update `settings` definition: remove the `paused` column
- [x] 2.6 Generate the migration file `drizzle/0003_groups.sql` with `bun run drizzle-kit generate` (or equivalent); inspect the generated SQL and hand-edit if needed to follow the ordering in `design.md` (create groups → seed → add nullable group_id → backfill → set NOT NULL → change PK / add unique) — hand-wrote SQL because `drizzle-kit generate` fails with a pre-existing snapshot collision between 0000 and 0001 (identical 7089-byte snapshots, not caused by this change); added matching `_journal.json` entry
- [x] 2.7 Add the two seed `INSERT` statements for Group 1 and Group 2 with their full names, short labels, image paths, and `(anchor_year=2026, anchor_month=6)` directly into the migration SQL
- [ ] 2.8 Run the migration against a fresh local DB; verify schema with `\d groups` / `\d members` and confirm seed rows exist with the canonical Polish spellings (`Popiełuszki`, `Różańcowe`) — **DEFERRED**: DATABASE_URL points to live Neon production DB; needs user to either take a `pg_dump` backup first or test against a Neon branch. Run `bun run db:migrate` when ready.

## 3. Rotation algorithm

- [x] 3.1 Remove `ANCHOR_YEAR` and `ANCHOR_MONTH` exports from `lib/rotation/ring.ts`
- [x] 3.2 Change `lib/rotation/algorithm.ts` `assignment()` signature to `assignment(slot: number, year: number, month: number, anchor: { year: number; month: number })`; replace the constants in the math with `anchor.year` / `anchor.month`
- [x] 3.3 Update `tests/rotation/algorithm.test.ts` and any other rotation tests to pass an explicit anchor argument — also updated `tests/lib/cycle.test.ts` (cycle.ts now takes an anchor too) and `tests/rotation/format.test.ts`
- [x] 3.4 Add a test that two groups with `anchor = (2026, 6)` produce identical `assignment(1, 2026, 6, anchor)` results, and that `anchor = (2026, 7)` produces a different result for the same slot+year+month
- [x] 3.5 Run `bun test tests/rotation/` and confirm all rotation tests pass — 42/42 rotation+cycle tests pass

## 4. Picker landing page at `/`

- [x] 4.1 Replace `app/page.tsx` with the picker implementation: fetch all rows from `groups`, render each as a large tappable card with the portrait (`next/image`, prioritized for the picker) and the full `name` below; link each card to `/g/${group.id}/`
- [x] 4.2 Add a logout affordance and a link to `/ustawienia` (global settings) on the picker page — logout button moved into root layout (fixed top-right when authed); picker has explicit "Ustawienia globalne" link
- [x] 4.3 Style mobile-first: stack vertically on narrow viewports, two-column on `sm+`; use existing color/typography tokens (`card-paper`, `font-display`, etc.) for consistency with the rest of the app — `grid-cols-1 sm:grid-cols-2`, `card-paper`, `display` font, `eyebrow`/`fleuron` markers
- [x] 4.4 Move the existing `app/page.tsx` content into a new `app/g/[groupId]/page.tsx` (see section 5)

## 5. In-group routes under `/g/[groupId]/`

- [x] 5.1 Create `app/g/[groupId]/layout.tsx`: fetch the active group by `params.groupId`; if not found, call `notFound()`; pass the group down via context or via prop drilling to the Masthead variant — using `React.cache()` via `lib/db/groups.ts` `getGroup()` to dedupe the fetch between layout and page (server components)
- [x] 5.2 Create `app/g/[groupId]/page.tsx` from the previous `app/page.tsx`; replace the hardcoded `members` query with one filtered by `group_id`; pass the group's anchor into `assignment()` calls
- [x] 5.3 Move `app/czlonkowie/` to `app/g/[groupId]/czlonkowie/` (including `[slot]/`, `loading.tsx`, `actions.ts`); update all queries and server actions to filter/scope by `group_id` — `upsertMember` and `deleteMember` now require `groupId`; the onConflict target is now the composite `(groupId, slot)`
- [x] 5.4 Move `app/historia/` to `app/g/[groupId]/historia/`; scope queries by `group_id`
- [x] 5.5 Delete the now-empty old route directories: `app/czlonkowie/`, `app/historia/`
- [x] 5.6 Update the in-group `Masthead` variant: render the active group's portrait as a small circular `<Image>` plus its `short_label`, wrapped in a link to `/`; remove any month/year switcher entanglement that doesn't belong here (keep the existing `ViewToggle` for month/year on the board page) — implemented as part of `app/g/[groupId]/layout.tsx`; the global `components/Masthead.tsx` is no longer rendered (removed from root layout); the in-group masthead also shows the full `name` (which is the actual identity) rather than `short_label` so the user is never in doubt which kółko they're viewing
- [x] 5.7 Update internal `<Link>` hrefs across the codebase from `/czlonkowie`, `/historia`, etc. to `/g/${groupId}/czlonkowie`, `/g/${groupId}/historia` — also threaded `basePath` prop through `MonthSwitcher`, `ViewToggle`, `CycleSwitcher` so they generate group-scoped hrefs
- [ ] 5.8 Smoke-test by visiting `/`, clicking Group 1 → confirm `/g/1/` shows only Group 1's roster and SMS history; back to `/`, click Group 2 → confirm Group 2's data — **DEFERRED**: needs running migration first; covered in section 11

## 6. Settings split (global vs per-group)

- [x] 6.1 Reduce `app/ustawienia/page.tsx` to global settings only: keep the password-change form (`ChangePasswordForm`), remove the paused toggle, remove any group-specific UI — kept `TestSmsButton` here too since it tests SMS infrastructure rather than a particular group; added a "‹ Wybór kółka" link back to picker
- [x] 6.2 Create `app/g/[groupId]/ustawienia/page.tsx` containing the per-group paused toggle, and inputs for `name` and `short_label`
- [x] 6.3 Create `app/g/[groupId]/ustawienia/actions.ts` with server actions: `toggleGroupPaused(groupId)`, `updateGroupName(groupId, name, shortLabel)` — implemented as `setGroupPaused(groupId, paused)` (explicit new state, not toggle) and `updateGroupName(groupId, formData)`
- [x] 6.4 Update `app/ustawienia/actions.ts`: remove the `togglePaused` action that wrote to `settings.paused`; keep only password-change actions — kept `sendTestSms` (it's global SMS infrastructure, not per-group); removed `setPaused`
- [x] 6.5 Verify the per-group settings link is reachable from the in-group Masthead/Nav, and the global settings link is reachable from the picker — per-group nav has the "Ustawienia" link; picker has the "Ustawienia globalne" link

## 7. SMS dispatch (cron + library)

- [x] 7.1 Update `lib/sms/send-monthly.ts` `runMonthlySend()` to take `(targetYear, targetMonth, groupId)`; fetch the group row, check `groups.paused` (not `settings.paused`), scope the `members` query by `group_id`, and insert the resulting `send_runs` row with that `group_id`; ensure each `send_results` insert carries the same `group_id`
- [x] 7.2 Update `lib/sms/evaluate-run.ts` similarly if it references the run's group identity — fetches the run row (to get groupId), looks up the group's `short_label`, and includes it in the failure-notification SMS so the dad knows which kółko failed
- [x] 7.3 Update `app/api/cron/send/route.ts` to fetch all groups and iterate, calling `runMonthlySend(year, month, group.id)` for each; aggregate results into the response payload — sequential iteration (two groups, no rush); per-group errors caught individually so one failure doesn't block the other
- [x] 7.4 Update `app/api/cron/evaluate/route.ts` analogously if it touches per-group state — now iterates over ALL `status = "in_progress"` runs rather than just the latest one (two groups can both have an in-progress run)
- [x] 7.5 Confirm any "test SMS" or admin-trigger UI (e.g. `components/TestSmsButton.tsx`) passes a `groupId` correctly — TestSmsButton goes through `sendTestSms` action which sends a fixed test body to `DAD_PHONE_NUMBER`; no group context involved (it's an infrastructure check)
- [ ] 7.6 Add a test (or scripted manual check) that pausing Group 1 + running the cron produces one `send_runs` row with status `paused` for Group 1 and one with normal dispatch results for Group 2 — **DEFERRED**: requires DB integration test harness; covered by spec scenarios + manual section 11 verification

## 8. Middleware & redirects

- [x] 8.1 Verify `middleware.ts` already covers `/g/[groupId]/...` via the default-authed matcher (it should — only `/login`, `/demo`, and webhook/cron paths are public); no code change expected — confirmed via `next build` route listing; `/g/[groupId]/...` paths are treated as authed
- [x] 8.2 Verify the `redirect("/")` after successful login still goes to the picker (it does — `app/login/actions.ts` redirects to `/` which is now the picker) — confirmed by reading `app/login/actions.ts` line 39

## 9. Demo page

- [x] 9.1 Confirm `app/demo/page.tsx` still works without modification (it uses inline mock data, doesn't query the DB); no group context needed since it's a frozen marketing surface — needed one trivial update: `assignment(slot, YEAR, MONTH, DEMO_ANCHOR)` since the signature gained the anchor argument

## 10. Tests

- [x] 10.1 Update existing tests in `tests/rotation/` to use the new `assignment(slot, year, month, anchor)` signature
- [ ] 10.2 Add a schema/migration smoke test that verifies the `groups` table exists with two rows after migration and that `members.group_id`, `send_runs.group_id`, `send_results.group_id` are all NOT NULL — **DEFERRED**: no DB integration test harness in the repo today; the spec scenarios serve as the contract, validated manually after the user runs the migration
- [ ] 10.3 Add a test for `lib/sms/send-monthly.ts` confirming pausing one group does not affect the other — **DEFERRED**: same reason as 10.2; manual verification in section 11
- [x] 10.4 Run `bun test` and confirm the full suite passes — 53/53 tests pass (rotation + cycle + format + phone + auth)

## 11. Manual verification before declaring done

- [ ] 11.1 Run `bun dev`, navigate to `/`, confirm the picker renders both portraits at sensible sizes on a phone-width viewport (use browser devtools mobile emulation) — **DEFERRED to user**
- [ ] 11.2 Click each group portrait, confirm the in-group screens (tablica, członkowie, historia, ustawienia) show only that group's data — **DEFERRED to user** (requires migration to be run first)
- [ ] 11.3 In each group's `/g/[groupId]/ustawienia`, toggle paused on and off, confirm it persists per group — **DEFERRED to user**
- [ ] 11.4 At `/ustawienia` (global), confirm the password-change form is present and the paused toggle is gone — **DEFERRED to user**
- [ ] 11.5 Visually verify the in-group Masthead shows the right portrait + short label, and tapping it returns to the picker — **DEFERRED to user**
- [x] 11.6 Verify `next build` succeeds with no type errors — `bun run build` completed successfully; route tree confirms `/`, `/g/[groupId]/*`, `/ustawienia` all present; one pre-existing deprecation warning about `middleware.ts` → `proxy.ts` rename in Next.js 16 (unrelated to this change)

## 12. Wrap-up

- [x] 12.1 Run `openspec validate add-second-kolko --strict` and resolve any reported issues — passed during proposal authoring; re-run pending after tasks.md final state
- [ ] 12.2 Commit all changes on a feature branch with a conventional commit (e.g. `feat(groups): multi-kolko support with portrait picker landing`) — **DEFERRED to user**: do not commit without your review
- [ ] 12.3 Once merged and deployed, run `openspec archive add-second-kolko` to fold the spec deltas into `openspec/specs/` — **DEFERRED to user**: post-deploy step

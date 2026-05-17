## ADDED Requirements

### Requirement: Group entity

The system SHALL model each *kółko różańcowe* as a row in a `groups` table with: a numeric `id` primary key, a full `name`, a short display `short_label`, an `image_path` pointing to a portrait asset in `public/`, an `anchor_year` and `anchor_month` defining the rotation start month, a boolean `paused` flag, and standard `created_at` / `updated_at` timestamps. The migration SHALL seed exactly two groups: Group 1 = *Kółko Różańcowe bł. Jerzego Popiełuszki* with image `/popieluszko.jpg`; Group 2 = *Kółko Różańcowe pod wezwaniem św. Józefa* with image `/swiety-jozef.webp`. Both seeded groups SHALL have `anchor_year = 2026` and `anchor_month = 6` (parallel rotation start) and `paused = false`.

#### Scenario: Schema contains groups table after migration

- **WHEN** migration `0003_groups.sql` has run against a fresh database
- **THEN** the `groups` table exists with the columns listed above
- **AND** two rows are present with ids 1 and 2 and the names/images/anchors specified
- **AND** the `anchor_month` column has a `CHECK` constraint enforcing the range 1..12

#### Scenario: Group names use canonical Polish spelling

- **WHEN** inspecting seeded group rows
- **THEN** Group 1's name contains `Popiełuszki` (with `ł` and `uszki` ending)
- **AND** Group 2's name contains `Różańcowe` (with `ń`) and `św. Józefa`

### Requirement: Per-group roster partitioning

The system SHALL partition the members roster by group. The `members` table SHALL gain a non-null `group_id` foreign key referencing `groups(id)`, and its primary key SHALL be the composite `(group_id, slot)`. The existing `slot BETWEEN 1 AND 20` CHECK SHALL remain unchanged and apply per group, so each group independently has slots 1..20. Existing rows SHALL be backfilled with `group_id = 1` during migration.

#### Scenario: Each group has independent slot numbering

- **WHEN** two members are inserted with the same `slot` value but different `group_id` values
- **THEN** both inserts succeed
- **AND** subsequent reads return the correct member for `(group_id, slot)`

#### Scenario: Backfill preserves existing data

- **WHEN** the migration runs against a database containing pre-existing members rows
- **THEN** every pre-existing row has `group_id = 1` after migration
- **AND** no row is dropped or duplicated

### Requirement: Per-group SMS run partitioning

The `send_runs` and `send_results` tables SHALL each gain a non-null `group_id` foreign key referencing `groups(id)`. Existing rows SHALL be backfilled with `group_id = 1`. The monthly SMS cron SHALL produce one `send_runs` row per group per month, and each group's `paused` flag SHALL be evaluated independently when deciding whether to skip a group's run.

#### Scenario: One run per group per month

- **WHEN** the monthly SMS cron fires for a given target year/month with both groups unpaused
- **THEN** exactly two `send_runs` rows are inserted (one per group)
- **AND** each row's `total_intended` equals the number of members in its group only

#### Scenario: Pausing one group does not affect the other

- **WHEN** Group 1 has `paused = true` and Group 2 has `paused = false`, and the monthly cron fires
- **THEN** Group 1 produces a `send_runs` row with status `paused` and zero sent messages
- **AND** Group 2 produces a `send_runs` row with status reflecting actual dispatch results
- **AND** Group 2's members receive their normal SMS messages

#### Scenario: send_results carry group identity

- **WHEN** SMS dispatch completes for both groups
- **THEN** every `send_results` row has a `group_id` matching its parent run's `group_id`

### Requirement: Per-group rotation anchor

The rotation algorithm SHALL accept the anchor (year and month) as a parameter rather than reading hardcoded constants. The `lib/rotation/algorithm.ts` `assignment()` function SHALL take the signature `assignment(slot, year, month, anchor)` where `anchor` is `{ year, month }`. The `ANCHOR_YEAR` and `ANCHOR_MONTH` constants in `lib/rotation/ring.ts` SHALL be removed. All call sites SHALL fetch the active group's anchor from its `groups` row and pass it through.

#### Scenario: Two groups with the same anchor produce identical assignments

- **WHEN** both groups have `anchor_year = 2026, anchor_month = 6` and `assignment(slot, year, month, anchor)` is called for the same slot+year+month with each group's anchor
- **THEN** both calls return the same `RingEntry`

#### Scenario: Two groups with different anchors produce different assignments

- **WHEN** Group 1 has anchor `(2026, 6)` and Group 2 has anchor `(2026, 7)` and `assignment(1, 2026, 6, anchor)` is called for each
- **THEN** Group 1's call returns the entry at `RING[0]` (slot 1's month-zero assignment)
- **AND** Group 2's call returns a different entry (slot 1 is one month earlier in its rotation)

### Requirement: Picker landing page

The route `/` SHALL render a picker page (no redirect to any per-group route). The picker SHALL display both seeded groups as large tappable cards, each showing the group's portrait (`image_path`) prominently and the full `name` below. Tapping/clicking a card SHALL navigate to `/g/[groupId]/`. The picker SHALL be served only to authenticated users; unauthenticated requests SHALL be redirected to `/login` by the existing middleware. The picker SHALL also include a logout affordance and a link to global settings (`/ustawienia`).

#### Scenario: Authenticated user sees both groups

- **WHEN** an authenticated user navigates to `/`
- **THEN** the response renders both group portraits with their full names
- **AND** each portrait is wrapped in a link to its `/g/[groupId]/` route

#### Scenario: Unauthenticated user is redirected

- **WHEN** an unauthenticated user requests `/`
- **THEN** the response is a redirect to `/login`

#### Scenario: Mobile layout stacks portraits vertically

- **WHEN** the picker is rendered on a viewport narrower than the design's `sm` breakpoint
- **THEN** the two group cards stack vertically rather than appearing side-by-side

### Requirement: In-group routes scoped by groupId path segment

All in-circle screens SHALL live under the dynamic segment `/g/[groupId]/`. Specifically: `/g/[groupId]/` (monthly/yearly board), `/g/[groupId]/czlonkowie` (roster), `/g/[groupId]/czlonkowie/[slot]` (per-slot editor), `/g/[groupId]/historia` (SMS history), `/g/[groupId]/ustawienia` (per-group settings). The previous routes `/czlonkowie`, `/czlonkowie/[slot]`, `/historia` SHALL no longer exist. Each in-group route SHALL fetch the group row by `groupId` and respond with 404 if it does not exist. All data queries within these routes SHALL filter by `group_id`.

#### Scenario: Members page shows only that group's members

- **WHEN** an authenticated user navigates to `/g/1/czlonkowie`
- **THEN** the response shows only members where `group_id = 1`
- **AND** does not show any members of Group 2

#### Scenario: Unknown groupId returns 404

- **WHEN** an authenticated user navigates to `/g/99/`
- **THEN** the response is a 404

#### Scenario: SMS history is group-scoped

- **WHEN** an authenticated user navigates to `/g/2/historia`
- **THEN** the response lists only `send_runs` rows where `group_id = 2`

### Requirement: Masthead reflects active group inside `/g/[groupId]/`

When rendered inside a `/g/[groupId]/...` route, the Masthead SHALL display the active group's portrait (rendered as a small circular thumbnail) and its `short_label` next to it. The portrait + label SHALL be a clickable link to `/`. The Masthead SHALL not render a switcher chip or any other in-page mechanism to navigate between groups — returning to `/` is the only switching mechanism.

#### Scenario: Group portrait visible on every in-group screen

- **WHEN** the user is on any `/g/[groupId]/...` page
- **THEN** the Masthead contains an `<img>` for that group's portrait and a text label with the `short_label`
- **AND** wrapping these in a link with `href="/"`

### Requirement: Settings split between global and per-group

The route `/ustawienia` SHALL contain only globally-scoped settings — specifically the password-change form. Per-group settings (the `paused` toggle, editing `name` / `short_label` / `image_path`) SHALL live at `/g/[groupId]/ustawienia`. The `settings.paused` column SHALL be dropped from the `settings` table as part of this change; the `paused` state SHALL be read and written exclusively via `groups.paused` for the relevant group.

#### Scenario: Global settings has no paused toggle

- **WHEN** an authenticated user navigates to `/ustawienia`
- **THEN** the page shows the password-change form
- **AND** the page does not show any paused toggle or group-specific fields

#### Scenario: Per-group settings can pause one group independently

- **WHEN** an authenticated user toggles `paused` on at `/g/1/ustawienia`
- **THEN** `groups.paused` is `true` for Group 1
- **AND** `groups.paused` for Group 2 is unchanged
- **AND** the next monthly cron run skips Group 1 but processes Group 2 normally

### Requirement: Portrait assets are stable, optimized, and committed

The portrait assets used by the picker and the in-group Masthead SHALL be stored in `public/` under stable semantic filenames: `/popieluszko.jpg` for Group 1 and `/swiety-jozef.webp` for Group 2. The original hash-named sources SHALL be removed after rename. The św. Józef image SHALL be re-encoded so that the production asset is at most ~100 KB; the Popiełuszko image already meets this bound and SHALL be kept as JPEG. The seeded `groups.image_path` values SHALL point to these public paths.

#### Scenario: Public assets are present and under size budget

- **WHEN** inspecting the `public/` directory after this change
- **THEN** `public/popieluszko.jpg` exists and is ≤ 100 KB
- **AND** `public/swiety-jozef.webp` exists and is ≤ 100 KB
- **AND** the original `public/408fd4869a5f5b3c9343651350b5aff2-3170773221.jpg` and `public/swiety-jozef-835713239.png` files have been deleted

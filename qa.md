# Q&A — Tajemniczka brainstorm

## Q1: Who actually operates the app — dad, you, or both?

**Answer:** Dad operates it himself.

**Implications:**
- UI must be in Polish
- Must be foolproof — minimal clicks, large readable text, no technical jargon
- Strong design pull toward automation/scheduling rather than "press button monthly"
  (a button dad has to remember = a single point of failure)
- Auth/access has to be trivial for dad (bookmark + auto-login, or PIN at most)
- Feature scope should stay tight; every option = something dad has to learn

## Q2a: What device does dad use, and what's his tech comfort?

**Answer:** Android phone. Webapp is the chosen delivery mechanism.

**Implications:**
- Mobile-first design (probably ~360–414px viewport)
- Polish keyboard input on mobile — assume thumb typing, not desktop precision
- PWA candidate: "Add to Home Screen" gives an app-like icon without Play Store
- The 20×12 table from the photo will not fit on a phone in its raw form —
  we will need a mobile-friendly representation (probably "this month" view
  + drilldown, not a literal grid)
- No iOS-specific concerns this round
- Tech comfort still unknown — needs follow-up

## Q2b: Tech comfort level (1–4)?

**Answer:** 3 — confident with online banking, web forms, email.

**Implications:**
- Dad can self-serve member list management (add/remove, edit phone numbers)
- A short PIN/password is acceptable; he can handle a login screen
- Dad can review a "sent log" and re-trigger failed sends if needed
- Dev (you) is no longer required in the monthly loop — only for setup, hosting, breakage
- We can show real data to dad (status, errors, history) without dumbing it down too far

## Q3: How does dad currently distribute the assignment to members? Is SMS automation a hard requirement?

**Answer:** (c) Dad already manually sends 20 individual SMS each month. Twilio is acceptable, the developer/son will pay.

**Implications:**
- Real pain point confirmed: ~20 messages typed by hand monthly
- Automating SMS sending is the actual product value, not a nice-to-have
- Twilio is the SMS provider (international, paid)
- Funding: developer son, not dad — so cost is a soft constraint, not a hard one

**Open concerns to address in spec:**
1. **Polish sender ID.** Twilio to Poland by default uses a long-code or short code unrecognizable to recipients. Older members may distrust an SMS from "+44…" or a random Twilio number. Need to investigate alphanumeric sender ID registration for Poland, or accept that members will be told once "you'll get SMS from this number — save it."
2. **Deliverability + verification.** Polish operators sometimes block A2P SMS without registration. We need a pre-launch deliverability test (send to 1–2 real numbers) before trusting it for all 20 members.
3. **Failure visibility.** Dad must be able to see "this SMS to Wysocki failed" and re-send / fall back to manual. Twilio webhook → status log in app.
4. **GDPR.** Storing 20 phone numbers + names → must have a deletion path and a clear "members consented" answer. Small group, low risk, but should not be invisible.

## Q4: How do member changes work? (frequency, slot vs list, group size)

**Q4a — Frequency:** Once every few years.

**Implications of Q4a:**
- Member-management UI is a rare-use surface — can be utilitarian, no need to optimize for speed
- Migration / re-shuffle logic doesn't need to be polished; "edit, save" is enough
- The 20-position ring rarely changes — the offset/epoch model stays valid for years at a time
- Slot-based vs list-based still TBD (Q4b) — frequency answer doesn't disambiguate

**Q4b — When a member leaves, does their slot stay vacant or does the list collapse?**

**Answer:** Dad keeps the slot vacant.

**Q4c — Group size?**

**Answer (inferred):** 20 fixed slots is the canonical structure. The group can run with fewer (vacant slots) until a new member is recruited.

**Implications:**
- **Data model: 20 fixed numbered slots** (1..20), each either holds a member or is vacant.
- The rotation is anchored to **slots, not members**. When a member is removed, the slot still rotates through the cycle — the assignment for that month simply has no recipient.
- A new member dropped into slot 7 immediately inherits the rotation that slot 7 has been on the whole time. No recomputation needed.
- For SMS sending: vacant slots produce no SMS, no error — just skipped.
- Algorithm becomes: `tajemnica(slot, month) = ring[(slot - 1 + months_since_epoch) mod 20]` where `ring` is the fixed 20-position sequence `I Ś, II Ś, ... V R`.
- The monthly view = "20 rows; rows with members get sent SMS; rows with vacancies are visually marked."

## Q6: Schedule and trust level

**Answer:** Fully automatic (option a). Last day of every month. Dad trusts the automation completely.

**Implications:**
- Backend scheduler required — runs unattended forever
- Cron expression: "last day of month" — i.e. `0 HH L * *` in CRON_TZ=Europe/Warsaw, or compute `tomorrow == day 1` daily and fire only when true
- No confirmation step in UI, no preview, no "send/cancel"
- Time of day TBD (Q6a)
- DST: Europe/Warsaw — must use a TZ-aware scheduler, not UTC offset

**Tension to resolve in spec — "trust completely" creates a silent-failure risk:**
- If SMS fails (Twilio outage, expired phone number, server down, code bug), dad has no
  idea unless members complain. By the time someone complains, they may have missed mass.
- Mitigation: dad gets a 21st SMS / push / email after each run with the result —
  "20/20 sent" or "18/20 sent — failures: Wysocki, Firlej". This is **not** a confirmation
  step (dad does nothing), just a passive receipt. Preserves "trust completely" while
  closing the silent-failure gap.
- Decision needed: does dad accept getting one extra SMS to himself per month as the
  observability mechanism? Or prefer email? Or nothing?

## Q7: Send time, observability, message content

**Q7a — Send time:** 09:00 Europe/Warsaw on the last day of each month.

**Q7b — Observability mechanism:** **SMS to dad only on failure.** Successful runs are silent. In-app log records every run regardless.

**Why this is the right call:**
- Happy path = zero noise (dad's intuition was right)
- Failure path = active alert (dad finds out within minutes, not weeks)
- Cheapest possible observability: ~12 dead-air months/year and maybe one "2/20 failed" SMS every few years
- In-app log still exists for dad to inspect details when an alert fires

**Implementation detail:**
- After the cron run completes, wait ~3 minutes for Twilio delivery webhooks to land (some `failed`/`undelivered` results are async, not in the initial API response)
- If aggregate result is "all OK" → log success, send nothing
- If any SMS has status `failed` or `undelivered` → send dad a single SMS:
  `Tajemniczka: nie wysłano SMS do: Wysocki, Firlej. Sprawdź aplikację.`
- The in-app log will show the same with full per-recipient detail.
- Edge case: if the cron itself doesn't run (server down) → no SMS will fire, including the failure SMS. We accept this; for v1, dad will notice when the entire month is silent. v2 enhancement: a separate "heartbeat" check.

**Q7c — Message template:** `Tajemnica na <miesiąc>: <rzymska> <nazwa>. Szczęść Boże.`

**Concrete examples:**
- `Tajemnica na czerwiec: V Bolesna. Szczęść Boże.`
- `Tajemnica na styczeń: I Chwalebna. Szczęść Boże.`
- `Tajemnica na grudzień: III Radosna. Szczęść Boże.`

**Implementation notes for the template:**
- Polish month names in *biernik* (which equals *mianownik* for all 12 months — no inflection issues).
- Tajemnica name is the **full long-form Polish adjective** (`Bolesna`, `Chwalebna`, `Radosna`, `Światła`), capitalized. The paper-table abbreviations (`B`, `CH`, `R`, `Ś`) are *not* used in SMS — members get the readable form.
- Roman numerals `I, II, III, IV, V` (not Arabic).
- Single sentence + closing `Szczęść Boże.` — keep it as-is, this is dad's voice.
- Length: ~40–50 chars → well under one SMS segment (160 chars), no concatenation cost.
- No member name in the body — keeps the SMS short and is consistent with dad's current style. (If dad wants `Witaj Romanie...` style we'd add it, but he didn't, so we don't.)
- No "from dad" signature — recipients know the sender ID/number.
- Encoding: contains `Ś`, `Ż`, `ć` → SMS is **GSM-7 incompatible**, will be sent as **UCS-2** → 70 chars per segment. Our message is ~45 chars → still one segment. Confirmed safe.

## Q8: Member fields, phone numbers, and rotation anchor

**Q8a — Phone numbers:** Dad has all 20 numbers ready. No external data-collection step needed before launch.

**Q8b — Member fields:** **Name + phone number**. That's it.

**Implications:**
- Single free-text `name` field (e.g., "Wysocki Roman") — no first/last split. Polish convention often puts surname first; let dad write it however he writes it on paper.
- Phone field stores in **E.164 format** internally (`+48XXXXXXXXX`) for Twilio compatibility, but UI accepts forgiving input (`123 456 789`, `+48 123-456-789`, etc.) and normalizes on save.
- No email, no date-of-birth, no notes, no active flag — keeping it ruthlessly minimal as dad asked. (If dad later wants imieniny reminders or notes, those become a follow-up feature.)
- Member is uniquely identified by **slot number** (1–20), not by name. Two members with similar names is fine. Slot is the primary key.

**Q8c — Rotation anchor:** Ignore the paper photo's rotation. Start fresh from June 2026: at month zero, **slot 1 = I Ś** and slots 2–20 are sequentially offset.

**Algorithm (locked in):**
```
RING = [I Ś, II Ś, III Ś, IV Ś, V Ś,
        I B, II B, III B, IV B, V B,
        I CH, II CH, III CH, IV CH, V CH,
        I R, II R, III R, IV R, V R]   # length 20

ANCHOR_YEAR  = 2026
ANCHOR_MONTH = 6   # June 2026 = month 0 of rotation

def assignment(slot, year, month):
    months_since_anchor = (year - 2026) * 12 + (month - 6)
    idx = ((slot - 1) + months_since_anchor) % 20
    return RING[idx]
```

**Sanity checks:**
- Jun 2026: slot 1 → I Ś ✓ ; slot 2 → II Ś ; slot 20 → V R
- Jul 2026: slot 1 → II Ś (advanced 1) ; slot 20 → I Ś (wrapped)
- Jun 2027: slot 1 → III CH (12 months later)

**Note on interpretation:** I'm reading "from the very beginning" as *slot 1 starts at position 1 (I Ś), and slots 2–20 are sequentially offset by their slot number*, mirroring the structure of the paper table (slot N is one position ahead of slot N−1). This means in any given month all 20 tajemnice are covered exactly once across the group — same property dad's paper table has. If you actually meant "everyone synchronously rotates as a group" (all 20 members on the same tajemnica), say so now. Otherwise this is the algorithm.

## Q9: Auth, hosting, edge cases

**Q9a — Auth:** (ii) Single password / PIN. Dad memorizes once, browser remembers.

**Implications:**
- One env-var-stored password (or a single hashed credential row in DB). No registration, no reset UI for v1 — if dad forgets, you reset it for him.
- Use HTTP-only session cookie, ~30-day expiry, "Remember me" by default.
- Login screen has one field (password) and one button. Polish copy.
- All routes (member CRUD, log view, settings, manual-send) gated behind the cookie.
- Twilio webhook (delivery status callback) must NOT require the cookie — it has its own signature-verified path.

**Q9b — Hosting / stack:** **Next.js (App Router) on Vercel.**

**Implications:**
- Frontend + backend in one Next.js codebase, Server Actions or Route Handlers for mutations.
- Hosting on Vercel free tier; sufficient for a 1-user, ~12-cron-runs/year, ~250-SMS/year app.
- **Database options compatible with Vercel:**
   - **Vercel Postgres** (Vercel-native, free tier 256MB) — overkill for our 23-number dataset but zero-friction.
   - **Turso (libSQL/SQLite)** — free tier generous, faster cold starts.
   - **Cloudflare D1** — possible but adds cross-platform complexity.
   - Recommendation: **Vercel Postgres** for v1 unless you object — least moving parts, integrates with Vercel's deploy flow, no second account to set up.
- **Cron:** Vercel Cron Jobs (free tier allows scheduled functions). Cron runs daily at 09:00 Europe/Warsaw, internally checks `if tomorrow.day == 1: send()`. Simpler than parsing "last day" cron syntax and works across DST/leap-year edge cases.
- **Bun** for local dev tooling per user's standing preference (`bun install`, `bun run dev` instead of `npm`). Vercel will still use Node at runtime — that's fine.
- **Env vars:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `ADMIN_PASSWORD_HASH`, `DAD_PHONE_NUMBER` (for failure SMS), `DATABASE_URL`.

**Q9c.3 — Manual test send:** Yes, build a "Send test SMS to dad's number" button in settings. Critical for verifying Twilio post-deploy and after any config change.

**Q9c.1 — Override (single-month swap)? — Proposed default: NO for v1.**

Rationale: building a per-month override doubles the data model complexity (now we need a `month_overrides` table, UI to edit it, logic for "is the formula or the override authoritative for this (slot, month)?"). The use case is also rare — if Wysocki is on holiday and can't lead his tajemnica, the *real* solution is "Wysocki asks Firlej to take it, they sort it out between themselves" — a social arrangement, not an app feature. The SMS still goes to Wysocki; he forwards it. Dad doesn't need to know.

If we ever do build it, the right shape is: dad opens a future month, taps a slot, "swap with..." picks another slot, the swap is stored as an override row that wins over the formula. Easy to add later. **Not v1.**

**Q9c.2 — Skip a month? — Proposed default: NO override, BUT add a global "pause sending" toggle.**

Rationale: explicit per-month skip UI is YAGNI. But a single "pause / resume" toggle in settings gives dad an emergency brake — if he ever needs the system to stop (e.g., broken phone numbers, Twilio account issue, religious calendar change, family emergency), one tap halts the next scheduled run. When toggled back on, the formula picks up where it would have been (the formula is stateless — paused or not, it always knows what June 2027 looks like).

This is one boolean in settings + one if-statement in the cron. Trivial to build, removes the "what if I need to pause?" anxiety entirely.

## Final small items I want to lock down before writing spec.md

1. **Initial member seeding.** I'll plan for *you* to seed the 20 members on first deploy via a script or one-time admin form, then dad takes over for ongoing edits. Confirm that's fine.

2. **Twilio sender ID for Poland.** I'll write the spec to start with a regular Twilio long-code (cheapest, fastest to launch). If deliverability turns out poor in pre-launch testing, we can revisit alphanumeric sender ID registration. **Acceptable to defer that decision?**

3. **Polish-only UI.** Confirm everything user-facing is in Polish, no language toggle, no English fallback. (Internal code, comments, env vars, error logs stay English.)

4. **History view scope.** The "in-app log" — how far back? My default: all runs ever, paginated 12 per page. Tiny data, no reason to truncate. Acceptable?

5. **Member name display in monthly view.** When dad opens "this month," he sees a list of 20 rows: `Slot 1 — Wysocki Roman — I Ś`. Phones shown? My default: phones hidden by default behind a "Pokaż numery" toggle, to keep the screen calm and the phones less visible to over-the-shoulder viewers. Acceptable?

## Q10: Final defaults

**Answer:** All five accepted as proposed.

1. Dev seeds initial 20 members; dad maintains thereafter — **OK**
2. Twilio long-code at launch, alphanumeric sender ID deferred — **OK**
3. Polish-only UI, no language toggle — **OK**
4. Full history retained in log, no truncation — **OK**
5. Phone numbers hidden behind "Pokaż numery" toggle on monthly view — **OK**

→ All product decisions are now locked. Proceeding to spec.md.

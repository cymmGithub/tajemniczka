# Widok rocznego cyklu rotacji — Design Spec

**Status:** Approved
**Data:** 2026-05-13
**Autor:** Przemek Świercz (z Claude)

## Cel

Dodać alternatywny widok na stronie `/` (Tablica), który pokazuje pełny 20-miesięczny cykl rotacji wszystkich członków w jednej tabeli. Obecna Tablica pokazuje stan jednego miesiąca; ten widok pokazuje całą rotację "na rzut oka".

## Motywacja

Algorytm rotacji jest cykliczny z okresem 20 miesięcy (`(slot-1 + monthsSinceAnchor) % 20`). Miesięczny widok daje stan punktowy; brakuje perspektywy "co Wysocki ma przez cały cykl", "kiedy ja mam Bolesną" oraz wizualnej weryfikacji że rotacja jest sprawiedliwa (każdy członek odwiedzi każdą tajemnicę dokładnie raz w cyklu).

## Decyzje projektowe

| Decyzja | Wartość | Powód |
|---|---|---|
| Lokalizacja | Toggle na `/` przez `?view=year` | "Przełączenia się" w intencji użytkownika; bez nowego routu |
| Orientacja | Członkowie = wiersze, miesiące = kolumny | "Lista członków" w intencji; ułatwia "co ma X przez cały rok" |
| Okno czasowe | Pełen 20-miesięczny cykl | Matematycznie kompletny widok — każdy slot pokazuje wszystkie 20 tajemnic |
| Start cyklu | Początek bieżącego cyklu (snap do anchor + N*20) | Stabilna struktura, naturalna nawigacja per-cykl |
| Cell representation | Compact chip — jeden kolorowy badge z `roman+group` wewnątrz | Mniej miejsca na mobile, zachowuje kodowanie liturgiczne |
| Mobile pattern | Horizontal scroll + sticky first column + gradient fade | Standard pattern, sprawdzony, najlepszy stosunek information density / czytelność |

## Architektura

### Routing

- `/` — Tablica miesięczna (domyślnie, jak dotychczas)
- `/?view=year` — Tablica cyklu
- `/?view=year&y=2028&m=2` — konkretny cykl (start month/year)
- `/?view=month&y=2026&m=6` — istniejący widok miesięczny

`view` query param: jeśli nieobecny lub inny niż `"year"` → traktowane jako `month`. Defaultowo `month`.

### Nowe pliki

```
lib/rotation/cycle.ts          (nowy)  — helpers: startOfCycle, addMonths, monthsSinceAnchor
components/ViewToggle.tsx      (nowy)  — przełącznik Miesiąc/Cykl
components/CycleTable.tsx      (nowy)  — server component: tabela 20×20
components/CycleSwitcher.tsx   (nowy)  — strzałki ±20 miesięcy + label cyklu
tests/lib/cycle.test.ts        (nowy)  — unit testy startOfCycle
```

### Modyfikowane pliki

```
components/Tajemnica.tsx       (modyfikacja) — dodanie propa `compact?: boolean`
app/page.tsx                   (modyfikacja) — branching na view; render miesięczny lub roczny
app/globals.css                (modyfikacja) — nowa klasa .tajemnica-chip i jej kolorystyka
```

## Logika cyklu

### Helpers w `lib/rotation/cycle.ts`

```ts
import { ANCHOR_YEAR, ANCHOR_MONTH } from "./ring";

export function monthsSinceAnchor(year: number, month: number): number {
  return (year - ANCHOR_YEAR) * 12 + (month - ANCHOR_MONTH);
}

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

/**
 * Snap do początku cyklu zawierającego (year, month).
 * Pre-anchor (months < 0): zwraca anchor (cykl 0).
 * Po anchor: floor(months/20)*20 daje początek cyklu.
 */
export function startOfCycle(year: number, month: number): { year: number; month: number } {
  const since = monthsSinceAnchor(year, month);
  if (since < 0) return { year: ANCHOR_YEAR, month: ANCHOR_MONTH };
  const cycleStart = Math.floor(since / 20) * 20;
  return addMonths(ANCHOR_YEAR, ANCHOR_MONTH, cycleStart);
}

/** Lista 20 par (year, month) od startu cyklu. */
export function cycleMonths(start: { year: number; month: number }): Array<{ year: number; month: number }> {
  return Array.from({ length: 20 }, (_, i) => addMonths(start.year, start.month, i));
}
```

### Unit testy (tests/lib/cycle.test.ts)

| Wejście (y, m) | Oczekiwany startOfCycle |
|---|---|
| 2026, 6 (anchor) | { 2026, 6 } |
| 2026, 5 (pre-anchor) | { 2026, 6 } |
| 2025, 1 (far pre-anchor) | { 2026, 6 } |
| 2027, 1 (anchor + 7) | { 2026, 6 } |
| 2028, 1 (anchor + 19) | { 2026, 6 } |
| 2028, 2 (anchor + 20) | { 2028, 2 } |
| 2028, 5 (anchor + 23) | { 2028, 2 } |
| 2029, 9 (anchor + 39) | { 2028, 2 } |
| 2029, 10 (anchor + 40) | { 2029, 10 } |

Dodatkowo:
- `cycleMonths({2026, 6})[0]` === `{2026, 6}`
- `cycleMonths({2026, 6})[19]` === `{2028, 1}`
- Slot 1 przez cycleMonths(anchor) = pełna sekwencja RING

## Komponenty

### `Tajemnica` (modyfikacja)

```tsx
type Props = {
  roman: string;       // "I" | "II" | "III" | "IV" | "V"
  group: TajemnicaCode;
  compact?: boolean;   // gdy true → renderuje compact chip
};

export function Tajemnica({ roman, group, compact = false }: Props) {
  if (compact) {
    return (
      <span className="tajemnica-chip" data-group={group}>
        {roman}{group}
      </span>
    );
  }
  // istniejące pełne renderowanie
}
```

CSS (`globals.css`):

```css
.tajemnica-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.8em;
  padding: 0.15em 0.4em;
  border-radius: 0.25em;
  font-family: var(--font-display);
  font-size: 0.78em;
  font-weight: 600;
  color: var(--color-paper);
  letter-spacing: 0;
  line-height: 1;
  font-feature-settings: "lnum";
}
.tajemnica-chip[data-group="Ś"]  { background: var(--color-gold); }
.tajemnica-chip[data-group="B"]  { background: var(--color-rubric); }
.tajemnica-chip[data-group="CH"] { background: var(--color-violet); }
.tajemnica-chip[data-group="R"]  { background: var(--color-marian); }
```

### `ViewToggle` (nowy klient)

```tsx
"use client";
// Dwa Link'i preservujące y, m query params, zmieniające tylko view.
// Aktywny: rubric + underline
// Nieaktywny: eyebrow (small caps, ink-faded)
```

Render:

```
[ Miesiąc ]   [ Cykl ]
   ↑aktywny
```

### `CycleSwitcher` (nowy)

Analog `MonthSwitcher` ale skok ±20 miesięcy. Format etykiety:

```
‹ Poprzedni cykl   Cykl: Czerwiec 2026 → Styczeń 2028   Następny cykl ›
```

Pre-anchor: "Poprzedni cykl" disabled (lub po prostu nie pokazuje się link gdy startOfCycle byłby pre-anchor).

### `CycleTable` (server component)

Dane:
- Czyta `members` z DB (mapa po slot)
- Z propów dostaje `start: { year, month }` (już znormalizowany przez startOfCycle)
- Wylicza `months = cycleMonths(start)` (20 par)
- Dla każdej (slot, month) pary woła `assignment(slot, m.year, m.month)`

Markup:

```tsx
<div className="cycle-wrapper relative">
  <div className="overflow-x-auto pb-2">
    <table className="cycle-table">
      <thead>
        <tr>
          <th className="sticky-col header-corner">Slot</th>
          {months.map((m, i) => (
            <th key={i} className={isCurrent(m) ? "current-month" : ""}>
              {monthShort(m)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {slots.map((slot) => {
          const member = bySlot.get(slot);
          const vacant = !member;
          return (
            <tr key={slot} className={vacant ? "row-vacant" : ""}>
              <th className="sticky-col">
                <span className="slot-num">{slot}.</span>
                {member ? (
                  <span className="member-name" title={member.name}>{member.name}</span>
                ) : (
                  <span className="vacant">— wakat —</span>
                )}
              </th>
              {months.map((m, i) => {
                const tj = assignment(slot, m.year, m.month);
                return (
                  <td key={i} className={isCurrent(m) ? "current-month" : ""}>
                    <Tajemnica roman={tj.roman} group={tj.group} compact />
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
  <div className="cycle-fade-right" aria-hidden />
</div>
```

CSS:

```css
.cycle-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.95rem;
}
.cycle-table th, .cycle-table td {
  padding: 0.5em 0.4em;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid var(--color-paper-shadow);
}
.cycle-table tr:nth-child(even) td,
.cycle-table tr:nth-child(even) th {
  background: rgba(241, 234, 215, 0.4); /* paper-deep/40 */
}
.cycle-table thead th {
  background: var(--color-paper-deep);
  font-family: var(--font-display);
  font-variant-caps: all-small-caps;
  letter-spacing: 0.08em;
  font-size: 0.85em;
  color: var(--color-ink-soft);
}
.cycle-table .sticky-col {
  position: sticky;
  left: 0;
  background: var(--color-paper);
  border-right: 1px solid var(--color-paper-shadow);
  box-shadow: 2px 0 4px rgba(0,0,0,0.04);
  text-align: left;
  white-space: nowrap;
  min-width: 6em;
  max-width: 8em;
}
.cycle-table .sticky-col .slot-num {
  font-family: var(--font-display);
  color: var(--color-ink-faded);
  margin-right: 0.4em;
}
.cycle-table .sticky-col .member-name {
  font-size: 0.92em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 5em;
  vertical-align: bottom;
}
.cycle-table .current-month {
  border-left: 2px solid var(--color-marian);
}
.cycle-table .row-vacant {
  opacity: 0.7;
}
.cycle-wrapper {
  position: relative;
}
.cycle-fade-right {
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: 2.5em;
  pointer-events: none;
  background: linear-gradient(to right, transparent, var(--color-paper) 80%);
}
```

## Visual styling

### ViewToggle (compact, pod Mastheadem, nad CycleSwitcher)

```
              [ Miesiąc ]   [ Cykl ]
                              ───
                              ↑ aktywny (rubric + underline)
```

### CycleSwitcher

```
‹ Poprzedni cykl       Następny cykl ›

         Cykl: Czerwiec 2026 → Styczeń 2028
         italic display, text-2xl, centered
```

### Tabela na mobile (~375px viewport)

```
┌────────────┬────┬────┬────┬─...
│   Slot     │ Cz │ Lp │ Si │     ← sticky header row
├────────────┼────┼────┼────┼─...
│ 1. Wysocki │[IŚ]│[IIŚ]│[IIIŚ]│   ← sticky first col
│ 2. Firlej  │[IIŚ]│[IIIŚ]│[IVŚ]│
│ ...        │... │... │... │
└────────────┴────┴────┴────┴─...
              ↑ scrollable area →     ↑ gradient fade
```

## Edge cases

| Sytuacja | Zachowanie |
|---|---|
| Pre-anchor (np. May 2026) | startOfCycle → anchor (Cz 2026); pierwszy cykl |
| Wakat (np. slot 18) | Wiersz pokazuje "— wakat —" w sticky col; tajemnice w komórkach normalnie; opacity 0.7 na wiersz |
| Długie nazwisko | Truncate z ellipsis w sticky col, full name jako title (tooltip) |
| view=year bez params | Defaultowo cykl bieżący (dziś) |
| view=year z y=2026&m=1 | snap do startOfCycle(2026,1) = anchor (Cz 2026) |
| Bieżący miesiąc znajduje się w widzianym cyklu | Kolumna ma left-border marian |
| Bieżący miesiąc poza cyklem (np. patrzymy na cykl 1 z czerwca 2026) | Brak highlight'u — naturalne |

## Testy

### Unit (`tests/lib/cycle.test.ts`)

Jak w tabeli wyżej (~9 cases dla `startOfCycle`, 3 dla `cycleMonths`).

### Integracyjne

Brak nowych — algorytm `assignment` jest już pokryty istniejącymi testami.

### Visual smoke (manual via Playwright)

- Login → `/` → kliknij `Cykl` → tabela się renderuje
- Scroll w prawo na mobile → sticky col zostaje, fade widoczny
- Kliknij `Następny cykl ›` → nowy zakres
- Pre-anchor: dziś (May 2026) → defaultnie pokazuje cykl 0
- Slot 18 (wakat) → "— wakat —" + pełen wiersz tajemnic

## Out of scope (v1)

- **Print stylesheet** — gdyby tata chciał drukować, dodać `@media print` później
- **Highlighting "ja"** — aplikacja nie wie kto jest taty, więc nie ma "moja linia"
- **Filtrowanie po członku** — jeden członek na raz przez search/filter; jest możliwe, ale ten widok służy całemu przeglądowi
- **Eksport CSV** — niepotrzebny dla taty
- **Animacja przy przełączaniu view** — fade-in/out byłoby ładne ale dodaje complexity bez znaczącej wartości

## Zależności

Bez nowych zależności npm. Wszystko z istniejących: React 19, Next.js 16, Tailwind 4.

## Tradeoffs i ryzyka

| Ryzyko | Mitygacja |
|---|---|
| Horizontal scroll na phone nie odkryty przez taty | Gradient-fade affordance + zebra striping; instrukcja "←  przesuń →" pod tabelą w v1.1 jeśli będzie feedback |
| Cell content `IIICH` ma 4 znaki — może wyglądać niejednolicie | Akceptujemy — wariancja szerokości chip 1.8em do 2.2em jest niewielka i wizualnie spójna z liturgiczną zmiennością |
| Pre-anchor user (przed Cz 2026) widzi cykl 0 jako "przyszłość" | Akurat dziś jesteśmy 1 miesiąc przed anchor — to krótkotrwała sytuacja, akceptujemy |
| Server component za każdym razem ładuje members → DB hit | Identyczny wzorzec jak Tablica miesięczna; force-dynamic = 1 query do DB per nawigacja, akceptowalne |

## Akceptacja

Po napisaniu implementation plan'u w `docs/superpowers/plans/2026-05-13-rok-view.md` można zaczynać kodowanie.

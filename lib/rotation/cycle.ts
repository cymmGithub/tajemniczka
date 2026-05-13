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
  return {
    year: Math.floor(total / 12),
    month: (((total % 12) + 12) % 12) + 1,
  };
}

export function startOfCycle(
  year: number,
  month: number,
): { year: number; month: number } {
  const since = monthsSinceAnchor(year, month);
  if (since < 0) return { year: ANCHOR_YEAR, month: ANCHOR_MONTH };
  const cycleStart = Math.floor(since / 20) * 20;
  return addMonths(ANCHOR_YEAR, ANCHOR_MONTH, cycleStart);
}

export function cycleMonths(start: {
  year: number;
  month: number;
}): Array<{ year: number; month: number }> {
  return Array.from({ length: 20 }, (_, i) =>
    addMonths(start.year, start.month, i),
  );
}

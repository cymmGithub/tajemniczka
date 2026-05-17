import type { Anchor } from "./ring";

export function monthsSinceAnchor(year: number, month: number, anchor: Anchor): number {
  return (year - anchor.year) * 12 + (month - anchor.month);
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
  anchor: Anchor,
): { year: number; month: number } {
  const since = monthsSinceAnchor(year, month, anchor);
  if (since < 0) return { year: anchor.year, month: anchor.month };
  const cycleStart = Math.floor(since / 20) * 20;
  return addMonths(anchor.year, anchor.month, cycleStart);
}

export function cycleMonths(start: {
  year: number;
  month: number;
}): Array<{ year: number; month: number }> {
  return Array.from({ length: 20 }, (_, i) =>
    addMonths(start.year, start.month, i),
  );
}

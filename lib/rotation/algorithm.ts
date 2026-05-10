import { RING, ANCHOR_YEAR, ANCHOR_MONTH, type RingEntry } from "./ring";

export function assignment(slot: number, year: number, month: number): RingEntry {
  if (slot < 1 || slot > 20) throw new Error(`slot out of range: ${slot}`);
  if (month < 1 || month > 12) throw new Error(`month out of range: ${month}`);

  const monthsSinceAnchor = (year - ANCHOR_YEAR) * 12 + (month - ANCHOR_MONTH);
  const raw = (slot - 1) + monthsSinceAnchor;
  const idx = ((raw % 20) + 20) % 20;
  return RING[idx];
}

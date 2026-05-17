import { assignment } from "./algorithm";
import type { Anchor } from "./ring";
import { MONTHS_PL, TAJEMNICE_LONG } from "../i18n/pl";

export function formatSmsBody(
  slot: number,
  year: number,
  month: number,
  anchor: Anchor,
): string {
  const entry = assignment(slot, year, month, anchor);
  const monthName = MONTHS_PL[month - 1];
  const longName = TAJEMNICE_LONG[entry.group];
  return `Tajemnica na ${monthName}: ${entry.roman} ${longName}. Szczęść Boże.`;
}

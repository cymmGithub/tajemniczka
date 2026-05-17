export type TajemnicaCode = "Ś" | "B" | "CH" | "R";

export interface RingEntry {
  roman: "I" | "II" | "III" | "IV" | "V";
  group: TajemnicaCode;
  /** Compact label: "I Ś", "V CH" — used in UI tables. */
  short: string;
}

const ROMAN = ["I", "II", "III", "IV", "V"] as const;
const GROUPS: TajemnicaCode[] = ["Ś", "B", "CH", "R"];

export const RING: ReadonlyArray<RingEntry> = GROUPS.flatMap((group) =>
  ROMAN.map((roman) => ({ roman, group, short: `${roman} ${group}` })),
);

/**
 * A rotation anchor — the (year, month) where slot 1 begins the cycle on
 * Mystery I Ś (RING[0]). Each kółko stores its own anchor in `groups`.
 */
export interface Anchor {
  year: number;
  month: number;
}

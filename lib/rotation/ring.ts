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

export const ANCHOR_YEAR = 2026;
export const ANCHOR_MONTH = 6; // June 2026 = month 0 of rotation

import { toZonedTime } from "date-fns-tz";
import { addDays, getDate, getMonth, getYear } from "date-fns";

export const TZ = "Europe/Warsaw";

export function nowInWarsaw(): Date {
  return toZonedTime(new Date(), TZ);
}

export function isLastDayOfMonth(date: Date): boolean {
  const tomorrow = addDays(date, 1);
  return getDate(tomorrow) === 1;
}

/** Returns { year, month } (1–12) of the day after `date`. */
export function nextDayMonthYear(date: Date): { year: number; month: number } {
  const t = addDays(date, 1);
  return { year: getYear(t), month: getMonth(t) + 1 };
}

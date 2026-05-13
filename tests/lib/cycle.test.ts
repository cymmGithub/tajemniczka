import { describe, it, expect } from "vitest";
import {
  monthsSinceAnchor,
  addMonths,
  startOfCycle,
  cycleMonths,
} from "../../lib/rotation/cycle";

describe("monthsSinceAnchor", () => {
  it("returns 0 at anchor (June 2026)", () => {
    expect(monthsSinceAnchor(2026, 6)).toBe(0);
  });
  it("returns -1 one month before anchor (May 2026)", () => {
    expect(monthsSinceAnchor(2026, 5)).toBe(-1);
  });
  it("returns 1 one month after anchor (July 2026)", () => {
    expect(monthsSinceAnchor(2026, 7)).toBe(1);
  });
  it("returns 12 one year after anchor (June 2027)", () => {
    expect(monthsSinceAnchor(2027, 6)).toBe(12);
  });
  it("returns -6 for December 2025", () => {
    expect(monthsSinceAnchor(2025, 12)).toBe(-6);
  });
});

describe("addMonths", () => {
  it("identity for delta=0", () => {
    expect(addMonths(2026, 6, 0)).toEqual({ year: 2026, month: 6 });
  });
  it("delta=1 advances within year", () => {
    expect(addMonths(2026, 6, 1)).toEqual({ year: 2026, month: 7 });
  });
  it("delta=12 advances year", () => {
    expect(addMonths(2026, 6, 12)).toEqual({ year: 2027, month: 6 });
  });
  it("delta=20 from anchor → { 2028, 2 }", () => {
    expect(addMonths(2026, 6, 20)).toEqual({ year: 2028, month: 2 });
  });
  it("negative delta crosses year backward", () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
  it("delta=-12 from anchor = June 2025", () => {
    expect(addMonths(2026, 6, -12)).toEqual({ year: 2025, month: 6 });
  });
  it("delta=-7 from anchor = November 2025", () => {
    expect(addMonths(2026, 6, -7)).toEqual({ year: 2025, month: 11 });
  });
});

describe("startOfCycle", () => {
  it("anchor month → anchor", () => {
    expect(startOfCycle(2026, 6)).toEqual({ year: 2026, month: 6 });
  });
  it("pre-anchor (May 2026) → anchor", () => {
    expect(startOfCycle(2026, 5)).toEqual({ year: 2026, month: 6 });
  });
  it("far pre-anchor (Jan 2025) → anchor", () => {
    expect(startOfCycle(2025, 1)).toEqual({ year: 2026, month: 6 });
  });
  it("anchor + 7 (Jan 2027) → still cycle 0 (anchor)", () => {
    expect(startOfCycle(2027, 1)).toEqual({ year: 2026, month: 6 });
  });
  it("anchor + 19 (Jan 2028) → still cycle 0 (anchor)", () => {
    expect(startOfCycle(2028, 1)).toEqual({ year: 2026, month: 6 });
  });
  it("anchor + 20 (Feb 2028) → cycle 1", () => {
    expect(startOfCycle(2028, 2)).toEqual({ year: 2028, month: 2 });
  });
  it("anchor + 23 (May 2028) → still cycle 1", () => {
    expect(startOfCycle(2028, 5)).toEqual({ year: 2028, month: 2 });
  });
  it("anchor + 39 (Sep 2029) → still cycle 1", () => {
    expect(startOfCycle(2029, 9)).toEqual({ year: 2028, month: 2 });
  });
  it("anchor + 40 (Oct 2029) → cycle 2", () => {
    expect(startOfCycle(2029, 10)).toEqual({ year: 2029, month: 10 });
  });
});

describe("cycleMonths", () => {
  it("returns 20 entries", () => {
    expect(cycleMonths({ year: 2026, month: 6 })).toHaveLength(20);
  });
  it("first entry equals start", () => {
    expect(cycleMonths({ year: 2026, month: 6 })[0]).toEqual({
      year: 2026,
      month: 6,
    });
  });
  it("last entry is start + 19 months (Jan 2028)", () => {
    expect(cycleMonths({ year: 2026, month: 6 })[19]).toEqual({
      year: 2028,
      month: 1,
    });
  });
  it("entries are sequential by one month each", () => {
    const months = cycleMonths({ year: 2026, month: 6 });
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1];
      const cur = months[i];
      const prevTotal = prev.year * 12 + prev.month;
      const curTotal = cur.year * 12 + cur.month;
      expect(curTotal - prevTotal).toBe(1);
    }
  });
});

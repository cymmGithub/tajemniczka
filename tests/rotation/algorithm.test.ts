import { describe, it, expect } from "vitest";
import { assignment } from "../../lib/rotation/algorithm";
import type { Anchor } from "../../lib/rotation/ring";

const JUN_2026: Anchor = { year: 2026, month: 6 };
const JUL_2026: Anchor = { year: 2026, month: 7 };

describe("assignment(slot, year, month, anchor)", () => {
  it("anchor: slot 1 in June 2026 → I Ś", () => {
    expect(assignment(1, 2026, 6, JUN_2026).short).toBe("I Ś");
  });

  it("anchor: slot 2 in June 2026 → II Ś", () => {
    expect(assignment(2, 2026, 6, JUN_2026).short).toBe("II Ś");
  });

  it("anchor: slot 20 in June 2026 → V R", () => {
    expect(assignment(20, 2026, 6, JUN_2026).short).toBe("V R");
  });

  it("July 2026: slot 1 advances to II Ś", () => {
    expect(assignment(1, 2026, 7, JUN_2026).short).toBe("II Ś");
  });

  it("July 2026: slot 20 wraps from V R → I Ś", () => {
    expect(assignment(20, 2026, 7, JUN_2026).short).toBe("I Ś");
  });

  it("June 2027 (12 months later): slot 1 → III CH", () => {
    expect(assignment(1, 2027, 6, JUN_2026).short).toBe("III CH");
  });

  it("past month: May 2026 (1 month before anchor): slot 1 → V R", () => {
    expect(assignment(1, 2026, 5, JUN_2026).short).toBe("V R");
  });

  it("far past: June 2025 (12 months before): slot 1 → IV B", () => {
    expect(assignment(1, 2025, 6, JUN_2026).short).toBe("IV B");
  });

  it("each month all 20 mysteries are covered exactly once", () => {
    const seen = new Set<string>();
    for (let s = 1; s <= 20; s++) seen.add(assignment(s, 2026, 6, JUN_2026).short);
    expect(seen.size).toBe(20);
  });

  it("rejects slot out of range", () => {
    expect(() => assignment(0, 2026, 6, JUN_2026)).toThrow();
    expect(() => assignment(21, 2026, 6, JUN_2026)).toThrow();
  });

  it("rejects month out of range", () => {
    expect(() => assignment(1, 2026, 0, JUN_2026)).toThrow();
    expect(() => assignment(1, 2026, 13, JUN_2026)).toThrow();
  });

  it("two groups with the same anchor produce identical assignments", () => {
    // Modeling: Group A and Group B both anchored at (2026, 6) — same as today.
    const a = assignment(1, 2026, 6, JUN_2026);
    const b = assignment(1, 2026, 6, JUN_2026);
    expect(a.short).toBe(b.short);
    expect(a.short).toBe("I Ś");
  });

  it("two groups with different anchors give different mysteries in the same month", () => {
    // Group A anchored June 2026, Group B anchored July 2026.
    // For slot 1 in June 2026:
    //   Group A: months-since-anchor = 0 → RING[0] = I Ś
    //   Group B: months-since-anchor = -1 → RING[19] = V R
    const a = assignment(1, 2026, 6, JUN_2026);
    const b = assignment(1, 2026, 6, JUL_2026);
    expect(a.short).toBe("I Ś");
    expect(b.short).toBe("V R");
    expect(a.short).not.toBe(b.short);
  });
});

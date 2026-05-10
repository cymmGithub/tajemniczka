import { describe, it, expect } from "vitest";
import { assignment } from "../../lib/rotation/algorithm";

describe("assignment(slot, year, month)", () => {
  it("anchor: slot 1 in June 2026 → I Ś", () => {
    expect(assignment(1, 2026, 6).short).toBe("I Ś");
  });

  it("anchor: slot 2 in June 2026 → II Ś", () => {
    expect(assignment(2, 2026, 6).short).toBe("II Ś");
  });

  it("anchor: slot 20 in June 2026 → V R", () => {
    expect(assignment(20, 2026, 6).short).toBe("V R");
  });

  it("July 2026: slot 1 advances to II Ś", () => {
    expect(assignment(1, 2026, 7).short).toBe("II Ś");
  });

  it("July 2026: slot 20 wraps from V R → I Ś", () => {
    expect(assignment(20, 2026, 7).short).toBe("I Ś");
  });

  it("June 2027 (12 months later): slot 1 → III CH", () => {
    expect(assignment(1, 2027, 6).short).toBe("III CH");
  });

  it("past month: May 2026 (1 month before anchor): slot 1 → V R", () => {
    expect(assignment(1, 2026, 5).short).toBe("V R");
  });

  it("far past: June 2025 (12 months before): slot 1 → IV B", () => {
    expect(assignment(1, 2025, 6).short).toBe("IV B");
  });

  it("each month all 20 mysteries are covered exactly once", () => {
    const seen = new Set<string>();
    for (let s = 1; s <= 20; s++) seen.add(assignment(s, 2026, 6).short);
    expect(seen.size).toBe(20);
  });

  it("rejects slot out of range", () => {
    expect(() => assignment(0, 2026, 6)).toThrow();
    expect(() => assignment(21, 2026, 6)).toThrow();
  });

  it("rejects month out of range", () => {
    expect(() => assignment(1, 2026, 0)).toThrow();
    expect(() => assignment(1, 2026, 13)).toThrow();
  });
});

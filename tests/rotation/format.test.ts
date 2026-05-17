import { describe, it, expect } from "vitest";
import { formatSmsBody } from "../../lib/rotation/format";
import type { Anchor } from "../../lib/rotation/ring";

const JUN_2026: Anchor = { year: 2026, month: 6 };

describe("formatSmsBody", () => {
  it("formats June assignment", () => {
    expect(formatSmsBody(1, 2026, 6, JUN_2026)).toBe(
      "Tajemnica na czerwiec: I Światła. Szczęść Boże.",
    );
  });

  it("formats December assignment for slot 20", () => {
    // (19 + 6) % 20 = 5 → RING[5] = I B
    expect(formatSmsBody(20, 2026, 12, JUN_2026)).toBe(
      "Tajemnica na grudzień: I Bolesna. Szczęść Boże.",
    );
  });

  it("body fits in one UCS-2 SMS segment (≤70 chars)", () => {
    const body = formatSmsBody(1, 2027, 9, JUN_2026);
    expect(body.length).toBeLessThanOrEqual(70);
  });

  it("uses long-form Polish name not abbreviation", () => {
    const body = formatSmsBody(6, 2026, 6, JUN_2026); // slot 6 = I B
    expect(body).toContain("Bolesna");
    expect(body).not.toMatch(/\bB\b/);
  });
});

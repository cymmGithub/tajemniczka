import { describe, it, expect } from "vitest";
import { normalizePhone, NormalizationError } from "../../lib/phone/normalize";

describe("normalizePhone", () => {
  it("accepts already-canonical E.164", () => {
    expect(normalizePhone("+48501234567")).toBe("+48501234567");
  });

  it("accepts Polish mobile with spaces", () => {
    expect(normalizePhone("501 234 567")).toBe("+48501234567");
  });

  it("accepts Polish number with hyphens and parens", () => {
    expect(normalizePhone("+48 (501) 234-567")).toBe("+48501234567");
  });

  it("accepts plain 9-digit Polish mobile", () => {
    expect(normalizePhone("501234567")).toBe("+48501234567");
  });

  it("rejects too-short numbers", () => {
    expect(() => normalizePhone("12345")).toThrow(NormalizationError);
  });

  it("rejects nonsense", () => {
    expect(() => normalizePhone("not a phone")).toThrow(NormalizationError);
  });

  it("rejects empty input", () => {
    expect(() => normalizePhone("")).toThrow(NormalizationError);
  });
});

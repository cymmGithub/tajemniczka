import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../lib/auth/password";

describe("password", () => {
  it("verifies a correctly-hashed password", async () => {
    const h = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", h)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const h = await hashPassword("hunter2");
    expect(await verifyPassword("not-it", h)).toBe(false);
  });

  it("rejects too-short password", async () => {
    await expect(hashPassword("")).rejects.toThrow();
    await expect(hashPassword("abc")).rejects.toThrow();
  });

  it("verifyPassword returns false on empty input", async () => {
    expect(await verifyPassword("", "$2a$12$abc")).toBe(false);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { hashPassword, verifyPassword } from "../functions/passwordRules.js";

let hash: string;

beforeAll(async () => {
  hash = await hashPassword("Noa!Pass101");
});

describe("hashPassword", () => {
  it("returns a 60-character bcrypt hash with cost factor 10", async () => {
    expect(hash).toHaveLength(60);
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("never returns the plain password", async () => {
    expect(hash).not.toContain("Noa!Pass101");
  });

  it("produces a different hash each time for the same password (random salt)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("Noa!Pass101"),
      hashPassword("Noa!Pass101"),
    ]);
    expect(a).not.toBe(b);
  });

  it("produces a hash that bcrypt can verify against the original password", async () => {
    expect(await bcrypt.compare("Noa!Pass101", hash)).toBe(true);
  });
});

describe("verifyPassword", () => {
  const password = "Noa!Pass101";
  let storedHash: string;

  // Hash once; bcrypt is deliberately slow
  beforeAll(async () => {
    storedHash = await bcrypt.hash(password, 10);
  });

  it("returns true for the correct password", async () => {
    expect(await verifyPassword(password, storedHash)).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    expect(await verifyPassword("WrongPass!", storedHash)).toBe(false);
  });

  it("is case-sensitive", async () => {
    expect(await verifyPassword("noa!pass101", storedHash)).toBe(false);
  });

  it("returns false for an empty password", async () => {
    expect(await verifyPassword("", storedHash)).toBe(false);
  });

  it("returns false when the stored hash is malformed", async () => {
    expect(await verifyPassword(password, "not-a-real-hash")).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { hashPassword } from "../validations/hashPassword.js";

describe("hashPassword", () => {
  it("returns a 60-character bcrypt hash with cost factor 10", async () => {
    const hash = await hashPassword("Noa!Pass101");
    expect(hash).toHaveLength(60);
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it("never returns the plain password", async () => {
    const hash = await hashPassword("Noa!Pass101");
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
    const hash = await hashPassword("Noa!Pass101");
    expect(await bcrypt.compare("Noa!Pass101", hash)).toBe(true);
  });
});

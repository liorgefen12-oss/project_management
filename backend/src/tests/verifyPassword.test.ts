import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { verifyPassword } from "../validations/verifyPassword.js";

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

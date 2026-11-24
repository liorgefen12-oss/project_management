import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { verifyPassword } from "../functions/passwordRules.js";

let hash: string;

beforeAll(async () => {
  hash = await bcrypt.hash("Noa!Pass101", 10);
});

describe("verifyPassword", () => {
  const password = "Noa!Pass101";

  it("returns true for the correct password", async () => {
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    expect(await verifyPassword("WrongPass!", hash)).toBe(false);
  });

  it("returns false for an empty password", async () => {
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("returns false when the stored hash is malformed", async () => {
    await expect(verifyPassword(password, "not-a-real-hash")).resolves.toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { canExecuteTask } from "../validations/canTaskBeExecuted.js"; // the file being tested

describe("canExecuteTask", () => {
  it("allows execution when budget covers the cost", () => {
    expect(canExecuteTask(100, 50)).toBe(true);
  });

  it("allows execution when budget equals the cost exactly", () => {
    expect(canExecuteTask(50, 50)).toBe(true); // edge case
  });

  it("blocks execution when budget is too low", () => {
    expect(canExecuteTask(10, 50)).toBe(false);
  });
});

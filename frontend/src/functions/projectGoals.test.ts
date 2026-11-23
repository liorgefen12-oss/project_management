import { describe, expect, it } from "vitest";
import { getProjectGoals, goalsFromInputs } from "./projectGoals";

describe("getProjectGoals", () => {
  it("extracts steps and cost from a goals object", () => {
    expect(getProjectGoals({ steps: 20, cost: 5000 })).toEqual({ steps: 20, cost: 5000 });
  });

  it("returns null for missing or malformed goals", () => {
    expect(getProjectGoals(null)).toBeNull();
    expect(getProjectGoals({ steps: 20 })).toBeNull();
    expect(getProjectGoals({ steps: "20", cost: 5000 })).toBeNull();
  });

  it("turns empty form inputs into no goals and filled ones into numbers", () => {
    expect(goalsFromInputs("", "")).toBeNull();
    expect(goalsFromInputs("5000", "20")).toEqual({ cost: 5000, steps: 20 });
  });
});

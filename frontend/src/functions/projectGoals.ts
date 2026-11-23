import type { ProjectGoals } from "../API/types";

// Pulls { steps, cost } out of a project's jsonb `goals` column.
// Returns null when goals are missing or malformed, so callers can just hide them.
export function getProjectGoals(goals: unknown): ProjectGoals | null {
  if (typeof goals !== "object" || goals === null) return null;
  const { steps, cost } = goals as Record<string, unknown>;
  if (typeof steps !== "number" || typeof cost !== "number") return null;
  return { steps, cost };
}

// Form inputs -> goals: both empty means "no goals"
export function goalsFromInputs(cost: string, steps: string): ProjectGoals | null {
  if (cost === "" && steps === "") return null;
  return { cost: Number(cost), steps: Number(steps) };
}

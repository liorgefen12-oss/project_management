import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

// Budget check and update in ONE atomic statement: the WHERE clause only
// matches if there's enough budget. Returns undefined when it doesn't.
export function spendBudgetOnTask(
  db: Kysely<Database>,
  projectId: string,
  cost: number,
  value: number,
) {
  return db
    .updateTable("public.projects")
    .set((eb) => ({
      budget: eb("budget", "-", cost),
      value: eb("value", "+", value),
    }))
    .where("project_id", "=", projectId)
    .where("budget", ">=", cost)
    .returning(["project_id", "budget", "value"])
    .executeTakeFirst();
}

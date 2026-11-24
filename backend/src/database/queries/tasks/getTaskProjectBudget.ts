import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

export function getTaskProjectBudget(db: Kysely<Database>, taskId: string) {
  return db
    .selectFrom("public.tasks as t")
    .innerJoin("public.projects as p", "p.project_id", "t.project")
    .select("p.budget")
    .where("t.task_id", "=", taskId)
    .executeTakeFirst();
}

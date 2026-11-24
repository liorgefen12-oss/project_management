import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

export function getProjectTaskPredecessors(
  db: Kysely<Database>,
  projectId: string,
) {
  return db
    .selectFrom("public.task_predecessors as p")
    .innerJoin("public.tasks as t", "t.task_id", "p.task_id")
    .select(["p.task_id", "p.predecessor_id"])
    .where("t.project", "=", projectId)
    .execute();
}

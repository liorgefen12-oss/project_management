import type { Db } from "./shared.js";

export function getProjectTaskPredecessors(db: Db, projectId: string) {
  return db
    .selectFrom("public.task_predecessors as p")
    .innerJoin("public.tasks as t", "t.task_id", "p.task_id")
    .select(["p.task_id", "p.predecessor_id"])
    .where("t.project", "=", projectId)
    .execute();
}

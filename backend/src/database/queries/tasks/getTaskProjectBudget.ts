import type { Db } from "./shared.js";

export function getTaskProjectBudget(db: Db, taskId: string) {
  return db
    .selectFrom("public.tasks as t")
    .innerJoin("public.projects as p", "p.project_id", "t.project")
    .select("p.budget")
    .where("t.task_id", "=", taskId)
    .executeTakeFirst();
}

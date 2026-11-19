import type { Db } from "./shared.js";

export function getTasksByName(db: Db, taskName: string) {
  return db
    .selectFrom("public.tasks as t")
    .selectAll("t")
    .where("t.task_name", "=", taskName)
    .orderBy("t.project")
    .orderBy("t.position")
    .execute();
}

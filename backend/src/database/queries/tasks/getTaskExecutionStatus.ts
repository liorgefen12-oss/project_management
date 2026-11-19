import type { Db } from "./shared.js";

export function getTaskExecutionStatus(db: Db, taskId: string) {
  return db
    .selectFrom("public.tasks")
    .select(["task_name", "executed"])
    .where("task_id", "=", taskId)
    .executeTakeFirstOrThrow();
}

import type { Db } from "./shared.js";

export async function isExecuted(db: Db, taskId: string) {
  const task = await db
    .selectFrom("public.tasks")
    .select("task_id")
    .where("task_id", "=", taskId)
    .where("executed", "=", true)
    .executeTakeFirst();
  return task !== undefined;
}

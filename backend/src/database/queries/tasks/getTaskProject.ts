import type { Db } from "./shared.js";

export async function getTaskProject(db: Db, taskId: string) {
  const task = await db
    .selectFrom("public.tasks")
    .select("project")
    .where("task_id", "=", taskId)
    .executeTakeFirst();
  return task?.project;
}

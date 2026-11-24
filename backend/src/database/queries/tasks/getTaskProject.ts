import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

export async function getTaskProject(db: Kysely<Database>, taskId: string) {
  const task = await db
    .selectFrom("public.tasks")
    .select("project")
    .where("task_id", "=", taskId)
    .executeTakeFirst();
  return task?.project;
}

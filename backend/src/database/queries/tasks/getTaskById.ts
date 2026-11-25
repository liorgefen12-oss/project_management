import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

export function getTaskById(db: Kysely<Database>, taskId: string) {
  return db
    .selectFrom("public.tasks as t")
    .selectAll("t")
    .where("task_id", "=", taskId)
    .executeTakeFirst();
}

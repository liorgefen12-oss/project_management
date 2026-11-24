import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

// Row lock so a double-click can't execute the same task twice
export function getTaskByIdForUpdate(db: Kysely<Database>, taskId: string) {
  return db
    .selectFrom("public.tasks as t")
    .selectAll("t")
    .where("task_id", "=", taskId)
    .forUpdate()
    .executeTakeFirst();
}

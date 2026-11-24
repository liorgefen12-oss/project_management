import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

export async function markExecuted(db: Kysely<Database>, taskId: string) {
  await db
    .updateTable("public.tasks")
    .set({ executed: true })
    .where("task_id", "=", taskId)
    .execute();
}

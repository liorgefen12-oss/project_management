import type { Db } from "./shared.js";

export async function markExecuted(db: Db, taskId: string) {
  await db
    .updateTable("public.tasks")
    .set({ executed: true })
    .where("task_id", "=", taskId)
    .execute();
}

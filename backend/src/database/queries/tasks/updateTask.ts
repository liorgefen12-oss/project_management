import type { Task, TaskUpdate } from "../../types.js";
import { taskById, type Db } from "./shared.js";

export async function updateTask(
  db: Db,
  taskId: string,
  changes: Pick<
    TaskUpdate,
    "task_name" | "description" | "cost" | "value" | "steps"
  >,
  predecessorIds?: readonly string[],
): Promise<Task> {
  if (!db.isTransaction) {
    return db
      .transaction()
      .execute((trx) => updateTask(trx, taskId, changes, predecessorIds));
  }
  if (Object.values(changes).some((value) => value !== undefined)) {
    await db
      .updateTable("public.tasks")
      .set(changes)
      .where("task_id", "=", taskId)
      .execute();
  }
  if (predecessorIds !== undefined) {
    await db
      .deleteFrom("public.task_predecessors")
      .where("task_id", "=", taskId)
      .execute();
    if (predecessorIds.length > 0) {
      await db
        .insertInto("public.task_predecessors")
        .values(
          predecessorIds.map((predecessor_id) => ({
            task_id: taskId,
            predecessor_id,
          })),
        )
        .execute();
    }
  }
  return taskById(db, taskId).executeTakeFirstOrThrow();
}

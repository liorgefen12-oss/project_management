import type { NewTask, Task } from "../../types.js";
import type { Db } from "./shared.js";

export async function insertTask(
  db: Db,
  task: NewTask,
  predecessorIds: readonly string[] = [],
): Promise<Task> {
  if (!db.isTransaction) {
    return db
      .transaction()
      .execute((trx) => insertTask(trx, task, predecessorIds));
  }
  const inserted = await db
    .insertInto("public.tasks")
    .values(task)
    .returningAll()
    .executeTakeFirstOrThrow();
  if (predecessorIds.length > 0) {
    await db
      .insertInto("public.task_predecessors")
      .values(
        predecessorIds.map((predecessor_id) => ({
          task_id: inserted.task_id,
          predecessor_id,
        })),
      )
      .execute();
  }
  return inserted;
}

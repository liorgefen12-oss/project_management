import type { Db } from "./shared.js";

export function getTaskDirectPredecessors(
  db: Db,
  taskId: string,
): Promise<{ task_id: string; executed: boolean }[]> {
  return db
    .selectFrom("public.task_predecessors as p")
    .innerJoin("public.tasks as t", "t.task_id", "p.predecessor_id")
    .select(["t.task_id", "t.executed"])
    .where("p.task_id", "=", taskId)
    .orderBy("t.task_id")
    .execute();
}

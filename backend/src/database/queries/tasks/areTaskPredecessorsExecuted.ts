import { sql } from "kysely";
import { predecessorChain, type Db } from "./shared.js";

export async function areTaskPredecessorsExecuted(
  db: Db,
  taskId: string,
): Promise<boolean> {
  const result = await sql<{ executed: boolean }>`
    ${predecessorChain(taskId)}
    select not exists (
      select 1 from chain c
      left join public.tasks t on t.task_id = c.task_id
      where c.cycle or t.task_id is null or not t.executed
    ) as executed
  `.execute(db);
  return result.rows[0].executed;
}

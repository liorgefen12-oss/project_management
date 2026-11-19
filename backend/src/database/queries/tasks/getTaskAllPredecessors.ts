import { sql } from "kysely";
import { predecessorChain, type Db } from "./shared.js";

export async function getTaskAllPredecessors(
  db: Db,
  taskId: string,
): Promise<{ task_id: string; executed: boolean }[]> {
  const result = await sql<{ task_id: string; executed: boolean }>`
    ${predecessorChain(taskId)}
    select t.task_id, t.executed
    from public.tasks t
    join (select task_id, min(depth) as depth from chain group by task_id) c
      on t.task_id = c.task_id
    where t.task_id <> ${taskId}::uuid
    order by c.depth, t.task_id
  `.execute(db);
  return result.rows;
}

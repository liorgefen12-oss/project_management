import { sql, type Kysely } from "kysely";
import type { Database } from "../../types.js";

export async function areTaskPredecessorsExecuted(
  db: Kysely<Database>,
  taskId: string,
): Promise<boolean> {
  const result = await sql<{ executed: boolean }>`
    with recursive chain as (
      select predecessor_id as task_id, 1 as depth,
             array[${taskId}::uuid, predecessor_id] as path,
             predecessor_id = ${taskId}::uuid as cycle
      from public.task_predecessors where task_id = ${taskId}::uuid
      union all
      select p.predecessor_id, c.depth + 1, c.path || p.predecessor_id,
             p.predecessor_id = any(c.path)
      from public.task_predecessors p
      join chain c on p.task_id = c.task_id
      where not c.cycle
    )
    select not exists (
      select 1 from chain c
      left join public.tasks t on t.task_id = c.task_id
      where c.cycle or t.task_id is null or not t.executed
    ) as executed
  `.execute(db);
  return result.rows[0].executed;
}

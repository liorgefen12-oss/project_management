import { sql, type Kysely } from "kysely";
import type { Database } from "../../types.js";

export async function getTaskAllPredecessors(
  db: Kysely<Database>,
  taskId: string,
): Promise<{ task_id: string; executed: boolean }[]> {
  const result = await sql<{ task_id: string; executed: boolean }>`
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
    select t.task_id, t.executed
    from public.tasks t
    join (select task_id, min(depth) as depth from chain group by task_id) c
      on t.task_id = c.task_id
    where t.task_id <> ${taskId}::uuid
    order by c.depth, t.task_id
  `.execute(db);
  return result.rows;
}

import { sql, type Kysely } from "kysely";
import type { Database } from "../../types.js";

export interface TaskPredecessor {
  task_id: string;
  executed: boolean;
  invalid?: boolean;
}

export async function getTaskAllPredecessors(
  db: Kysely<Database>,
  taskId: string,
  options: { includeInvalid?: boolean } = {},
): Promise<TaskPredecessor[]> {
  const result = await sql<{
    task_id: string;
    executed: boolean | null;
    invalid: boolean;
  }>`
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
    select c.task_id, t.executed, (c.cycle or t.task_id is null) as invalid
    from (
      select task_id, min(depth) as depth, bool_or(cycle) as cycle
      from chain group by task_id
    ) c
    left join public.tasks t on t.task_id = c.task_id
    where ${options.includeInvalid ?? false}
       or (t.task_id is not null and t.task_id <> ${taskId}::uuid)
    order by c.depth, t.task_id
  `.execute(db);
  return result.rows.map((row) => ({
    task_id: row.task_id,
    executed: row.executed ?? false,
    ...(options.includeInvalid && row.invalid ? { invalid: true } : {}),
  }));
}

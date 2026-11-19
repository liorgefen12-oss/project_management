import { sql, type Kysely } from "kysely";
import type { Database } from "../../types.js";

export type Db = Kysely<Database>;

export function tasksById(db: Db, projectId: string) {
  return db
    .selectFrom("public.tasks as t")
    .selectAll("t")
    .where("t.project", "=", projectId)
    .orderBy("t.position", "asc");
}

export function tasksByName(db: Db, projectName: string) {
  return db
    .selectFrom("public.tasks as t")
    .innerJoin("public.projects as p", "p.project_id", "t.project")
    .selectAll("t")
    .where("p.name", "=", projectName)
    .orderBy("t.position", "asc");
}

export async function totalById(
  db: Db,
  projectId: string,
  column: "cost" | "value",
): Promise<string> {
  const result = await db
    .selectFrom("public.tasks")
    .select(sql<string>`coalesce(sum(${sql.ref(column)}), 0)::text`.as("total"))
    .where("project", "=", projectId)
    .executeTakeFirstOrThrow();
  return result.total;
}

export async function totalByName(
  db: Db,
  projectName: string,
  column: "cost" | "value",
): Promise<string> {
  const result = await db
    .selectFrom("public.tasks as t")
    .innerJoin("public.projects as p", "p.project_id", "t.project")
    .select(
      sql<string>`coalesce(sum(${sql.ref(`t.${column}`)}), 0)::text`.as(
        "total",
      ),
    )
    .where("p.name", "=", projectName)
    .executeTakeFirstOrThrow();
  return result.total;
}

export function taskById(db: Db, taskId: string) {
  return db
    .selectFrom("public.tasks as t")
    .selectAll("t")
    .where("task_id", "=", taskId);
}

export function predecessorChain(taskId: string) {
  // Keep cycle information inside SQL rather than adding graph fields to task results.
  return sql`
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
  `;
}

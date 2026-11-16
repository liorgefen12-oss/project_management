import { sql, type Kysely } from "kysely";
import type { Database, Task } from "./types.js";

export function createProjectQueries(database: Kysely<Database>) {
  function tasksById(projectId: string) {
    return database
      .selectFrom("public.tasks")
      .selectAll()
      .where("project", "=", projectId)
      .orderBy("position", "asc");
  }

  function tasksByName(projectName: string) {
    return database
      .selectFrom("public.tasks as t")
      .innerJoin("public.projects as p", "p.project_id", "t.project")
      .selectAll("t")
      .where("p.name", "=", projectName)
      .orderBy("t.position", "asc");
  }

  async function totalById(
    projectId: string,
    column: "cost" | "value",
  ): Promise<string> {
    const result = await database
      .selectFrom("public.tasks")
      .select(
        sql<string>`coalesce(sum(${sql.ref(column)}), 0)::text`.as("total"),
      )
      .where("project", "=", projectId)
      .executeTakeFirstOrThrow();
    return result.total;
  }

  async function totalByName(
    projectName: string,
    column: "cost" | "value",
  ): Promise<string> {
    const result = await database
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

  return {
    getTasksByProjectId: (projectId: string) => tasksById(projectId).execute(),

    getTasksByProjectIdAndStatus: (projectId: string, completed: boolean) =>
      tasksById(projectId).where("executed", "=", completed).execute(),

    getTasksByProjectName: (projectName: string) =>
      tasksByName(projectName).execute(),

    getTasksByProjectNameAndStatus: (projectName: string, completed: boolean) =>
      tasksByName(projectName).where("t.executed", "=", completed).execute(),

    getProjectTotalCostById: (projectId: string) =>
      totalById(projectId, "cost"),

    getProjectTotalCostByName: (projectName: string) =>
      totalByName(projectName, "cost"),

    getProjectTotalValueById: (projectId: string) =>
      totalById(projectId, "value"),

    getProjectTotalValueByName: (projectName: string) =>
      totalByName(projectName, "value"),

    async getTaskPredecessors(taskId: string): Promise<Task[]> {
      const result = await sql<Task>`
        select * from public.get_task_predecessors(${taskId}::uuid)
      `.execute(database);
      return result.rows;
    },
    async updateTaskPosition(
      taskId: string,
      newPosition: number,
    ): Promise<void> {
      if (!Number.isInteger(newPosition)) {
        throw new RangeError("Task position must be an integer.");
      }
      await sql`
        select public.update_task_position(${taskId}::uuid, ${newPosition}::integer)
      `.execute(database);
    },
  };
}

import type { Context } from "koa";

export async function logAction(
  ctx: Context,
  userId: string,
  actionName: string,
  ids: { projectId?: string; taskId?: string } = {},
) {
  const action = await ctx.database
    .selectFrom("audit.task_actions")
    .select("action_id")
    .where("action_name", "=", actionName)
    .executeTakeFirstOrThrow();

  await ctx.database
    .insertInto("audit.logs")
    .values({
      user_id: userId,
      action_id: action.action_id,
      project_id: ids.projectId ?? null,
      task_id: ids.taskId ?? null,
    })
    .execute();
}

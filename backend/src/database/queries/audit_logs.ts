import type { Context } from "koa";
import type { Kysely } from "kysely";
import type { Database } from "../db.js";

export async function logAction(
  db: Kysely<Database>,

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

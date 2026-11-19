import type { Context } from "koa";
import type { z } from "zod";
import { projectExists } from "../../database/queries/projects.js";
import { getProjectBoardTasks } from "../../database/queries/tasks.js";
import { messages } from "../../messages.js";
import type { projectTasksRequestSchema } from "../../zod/schemas.js";

export async function listProjectTasks(ctx: Context) {
  const { params, query } = ctx.state.validated as z.infer<typeof projectTasksRequestSchema>;

  if (!(await projectExists(ctx.database, params.id))) {
    ctx.throw(404, messages[404].projectNotFound);
  }
  ctx.body = await getProjectBoardTasks(ctx.database, params.id, query.executed);
}

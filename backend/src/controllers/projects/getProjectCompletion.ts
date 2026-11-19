import type { Context } from "koa";
import type { z } from "zod";
import {
  areAllProjectTasksExecuted,
  projectExists,
} from "../../database/queries/projects.js";
import { messages } from "../../messages.js";
import type { idRequestSchema } from "../../zod/schemas.js";

export async function getProjectCompletion(ctx: Context) {
  const { params } = ctx.state.validated as z.infer<typeof idRequestSchema>;
  if (!(await projectExists(ctx.database, params.id))) {
    ctx.throw(404, messages[404].projectNotFound);
  }
  ctx.body = {
    project_id: params.id,
    completed: await areAllProjectTasksExecuted(ctx.database, params.id),
  };
}

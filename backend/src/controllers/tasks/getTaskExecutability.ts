import type { Context } from "koa";
import type { z } from "zod";
import { getTaskById } from "../../database/queries/tasks.js";
import { canExecuteTask } from "../../functions/taskExecutionRules.js";
import { messages } from "../../messages.js";
import type { idParamSchema } from "../../zod/schemas.js";

export async function getTaskExecutability(ctx: Context) {
  const { params } = ctx.state.validated as {
    params: z.infer<typeof idParamSchema>;
  };
  const task = await getTaskById(ctx.database, params.id);
  if (!task) return ctx.throw(404, messages[404].taskNotFound);

  const check = await canExecuteTask(ctx.database, task);
  ctx.body = check.executable;
}

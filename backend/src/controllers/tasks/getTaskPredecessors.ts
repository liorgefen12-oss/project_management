import type { Context } from "koa";
import type { z } from "zod";
import {
  getTaskById,
  getTaskAllPredecessors,
} from "../../database/queries/tasks.js";
import { messages } from "../../messages.js";
import type { idParamSchema } from "../../zod/schemas.js";

export async function getTaskPredecessors(ctx: Context) {
  const { params } = ctx.state.validated as {
    params: z.infer<typeof idParamSchema>;
  };
  const task = await getTaskById(ctx.database, params.id);
  if (!task) ctx.throw(404, messages[404].taskNotFound);
  ctx.body = await getTaskAllPredecessors(ctx.database, params.id);
}

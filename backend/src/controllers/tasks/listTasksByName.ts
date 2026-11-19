import type { Context } from "koa";
import type { z } from "zod";
import { getTasksByName } from "../../database/queries/tasks.js";
import type { taskNameRequestSchema } from "../../zod/schemas.js";

export async function listTasksByName(ctx: Context) {
  const { query } = ctx.state.validated as z.infer<
    typeof taskNameRequestSchema
  >;
  ctx.body = await getTasksByName(ctx.database, query.name);
}

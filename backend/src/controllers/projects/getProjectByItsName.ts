import type { Context } from "koa";
import type { z } from "zod";
import { getProjectByName } from "../../database/queries/projects.js";
import { messages } from "../../messages.js";
import type { projectNameRequestSchema } from "../../zod/schemas.js";

export async function getProjectByItsName(ctx: Context) {
  const { query } = ctx.state.validated as z.infer<typeof projectNameRequestSchema>;
  const project = await getProjectByName(ctx.database, query.name);
  if (!project) ctx.throw(404, messages[404].projectNotFound);
  ctx.body = project;
}

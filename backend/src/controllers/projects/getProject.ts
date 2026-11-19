import type { Context } from "koa";
import type { z } from "zod";
import { getProjectById } from "../../database/queries/projects.js";
import { messages } from "../../messages.js";
import type { idRequestSchema } from "../../zod/schemas.js";

export async function getProject(ctx: Context) {
  const { params } = ctx.state.validated as z.infer<typeof idRequestSchema>;

  const project = await getProjectById(ctx.database, params.id);
  if (!project) ctx.throw(404, messages[404].projectNotFound);
  ctx.body = project;
}

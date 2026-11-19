import type { Context } from "koa";
import type { z } from "zod";
import { getProjectById } from "../../database/queries/projects.js";
import { getTaskProject } from "../../database/queries/tasks.js";
import { messages } from "../../messages.js";
import type { idRequestSchema } from "../../zod/schemas.js";

export async function getProjectByTask(ctx: Context) {
  const { params } = ctx.state.validated as z.infer<typeof idRequestSchema>;
  const projectId = await getTaskProject(ctx.database, params.id);
  if (!projectId) ctx.throw(404, messages[404].taskNotFound);
  const project = await getProjectById(ctx.database, projectId);
  if (!project) ctx.throw(404, messages[404].projectNotFound);
  ctx.body = project;
}

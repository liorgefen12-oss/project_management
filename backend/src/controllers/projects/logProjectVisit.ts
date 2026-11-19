import type { Context } from "koa";
import type { z } from "zod";
import { logAction } from "../../database/queries/audit_logs.js";
import { projectExists } from "../../database/queries/projects.js";
import { messages } from "../../messages.js";
import type { idRequestSchema } from "../../zod/schemas.js";

export async function logProjectVisit(
  ctx: Context,
  action: "project sign in" | "project sign out",
) {
  const { params } = ctx.state.validated as z.infer<typeof idRequestSchema>;
  if (!(await projectExists(ctx.database, params.id))) {
    ctx.throw(404, messages[404].projectNotFound);
  }
  await logAction(ctx.database, ctx.session!.userId, action, {
    projectId: params.id,
  });
  ctx.status = 204;
}

import type { Context } from "koa";
import type { z } from "zod";
import { logAction } from "../../database/queries/audit_logs.js";
import {
  getProjectByIdForUpdate,
  updateProject,
} from "../../database/queries/projects.js";
import { messages } from "../../messages.js";
import type { idParamSchema, updateProjectSchema } from "../../zod/schemas.js";

export async function editProject(ctx: Context) {
  const { params, body } = ctx.state.validated as {
    params: z.infer<typeof idParamSchema>;
    body: z.infer<typeof updateProjectSchema>;
  };
  const userId = ctx.session!.userId;

  try {
    const project = await ctx.database.transaction().execute(async (trx) => {
      const current = await getProjectByIdForUpdate(trx, params.id);
      if (!current) return ctx.throw(404, messages[404].projectNotFound);
      const updated = await updateProject(trx, params.id, body);
      // Same audit action as spending budget on a task
      if (updated.budget !== current.budget) {
        await logAction(trx, userId, "budget changed", { projectId: params.id });
      }
      return updated;
    });
    ctx.body = { message: messages[200].projectUpdatedSuccessfully, project };
  } catch (err: any) {
    if (err?.code === "23505") {
      ctx.throw(409, messages[409].projectAlreadyExists);
    }
    throw err;
  }
}

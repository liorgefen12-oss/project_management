import type { Context } from "koa";
import type { z } from "zod";
import { logAction } from "../../database/queries/audit_logs.js";
import {
  getProjectByIdForUpdate,
  refreshProjectGoalsMet,
} from "../../database/queries/projects.js";
import { getProjectBoardTasks, insertTask, lockProjectTaskChanges } from "../../database/queries/tasks.js";
import { messages } from "../../messages.js";
import type { createTaskSchema } from "../../zod/schemas.js";
import { validatePredecessors, validatePredecessorOrder } from "./validatePredecessors.js";

export async function createTask(ctx: Context) {
  const { body } = ctx.state.validated as {
    body: z.infer<typeof createTaskSchema>;
  };

  const { predecessor_ids = [], ...task } = body;
  try {
    ctx.body = await ctx.database.transaction().execute(async (trx) => {
      await lockProjectTaskChanges(trx, task.project);
      if (!(await getProjectByIdForUpdate(trx, task.project))) {
        ctx.throw(404, messages[404].projectNotFound);
      }
      await validatePredecessors(ctx, trx, task.project, predecessor_ids);
      const board = await getProjectBoardTasks(trx, task.project);
      validatePredecessorOrder(ctx, board, task.position, predecessor_ids);
      const inserted = await insertTask(trx, task, predecessor_ids);
      await refreshProjectGoalsMet(trx, task.project);
      await logAction(trx, ctx.session!.userId, "task created", {
        projectId: inserted.project,
        taskId: inserted.task_id,
      });
      return inserted;
    });
    ctx.status = 201;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      if (err.code === "23505") {
        ctx.throw(409, messages[409].taskPositionTaken);
      }
      if (err.code === "23503") {
        ctx.throw(409, messages[409].taskReferenceMissing);
      }
    }
    throw err;
  }
}

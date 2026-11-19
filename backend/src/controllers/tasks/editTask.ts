import type { Context } from "koa";
import type { z } from "zod";
import {
  getTaskById,
  getTaskByIdForUpdate,
  getProjectBoardTasks,
  lockProjectTaskChanges,
  updateTask,
} from "../../database/queries/tasks.js";
import { messages } from "../../messages.js";
import type { idParamSchema, updateTaskSchema } from "../../zod/schemas.js";
import { validatePredecessors, validatePredecessorOrder } from "./validatePredecessors.js";

export async function editTask(ctx: Context) {
  const { params, body } = ctx.state.validated as {
    params: z.infer<typeof idParamSchema>;
    body: z.infer<typeof updateTaskSchema>;
  };
  const initialTask = await getTaskById(ctx.database, params.id);
  if (!initialTask) return ctx.throw(404, messages[404].taskNotFound);

  const task = await ctx.database.transaction().execute(async (trx) => {
    await lockProjectTaskChanges(trx, initialTask.project);
    const currentTask = await getTaskByIdForUpdate(trx, params.id);
    if (!currentTask) return ctx.throw(404, messages[404].taskNotFound);
    if (currentTask.executed)
      ctx.throw(409, messages[409].executedTaskReadOnly);
    const { predecessor_ids, ...changes } = body;
    if (predecessor_ids !== undefined) {
      await validatePredecessors(
        ctx,
        trx,
        currentTask.project,
        predecessor_ids,
        params.id,
      );
      const board = await getProjectBoardTasks(trx, currentTask.project);
      validatePredecessorOrder(
        ctx,
        board,
        currentTask.position,
        predecessor_ids,
      );
    }
    return updateTask(trx, params.id, changes, predecessor_ids);
  });
  ctx.body = { message: messages[200].taskUpdatedSuccessfully, task };
}

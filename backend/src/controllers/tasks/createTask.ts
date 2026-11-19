import type { Context } from "koa";
import type { z } from "zod";
import { projectExists } from "../../database/queries/projects.js";
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
      if (!(await projectExists(trx, task.project))) {
        ctx.throw(404, messages[404].projectNotFound);
      }
      await lockProjectTaskChanges(trx, task.project);
      await validatePredecessors(ctx, trx, task.project, predecessor_ids);
      const board = await getProjectBoardTasks(trx, task.project);
      validatePredecessorOrder(ctx, board, task.position, predecessor_ids);
      return insertTask(trx, task, predecessor_ids);
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

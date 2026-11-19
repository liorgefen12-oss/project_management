import type { Context } from "koa";
import type { z } from "zod";
import { logAction } from "../../database/queries/audit_logs.js";
import { spendBudgetOnTask } from "../../database/queries/projects.js";
import { getTaskByIdForUpdate, markExecuted } from "../../database/queries/tasks.js";
import { canExecuteTask } from "../../functions/taskExecutionRules.js";
import { messages } from "../../messages.js";
import type { idParamSchema } from "../../zod/schemas.js";
import { logProjectCompletion } from "../projects/logProjectCompletion.js";

export async function executeTask(ctx: Context) {
  const { params } = ctx.state.validated as {
    params: z.infer<typeof idParamSchema>;
  };
  const userId = ctx.session!.userId;

  const result = await ctx.database.transaction().execute(async (trx) => {
    const task = await getTaskByIdForUpdate(trx, params.id);

    if (!task) return ctx.throw(404, messages[404].taskNotFound);
    const check = await canExecuteTask(trx, task);
    if (!check.executable) {
      if (task.executed) ctx.throw(409, check.reason);
      await logAction(trx, userId, "popup - unavailable task", {
        projectId: task.project,
        taskId: task.task_id,
      });
      return { error: check.reason };
    }

    const updated = await spendBudgetOnTask(
      trx,
      task.project,
      task.cost,
      task.value,
    );
    if (!updated) {
      await logAction(trx, userId, "popup - unavailable task", {
        projectId: task.project,
        taskId: task.task_id,
      });
      return { error: messages[409].insufficientBudget };
    }

    await markExecuted(trx, task.task_id);

    await logAction(trx, userId, "task completed", {
      projectId: task.project,
      taskId: task.task_id,
    });

    if (task.cost !== 0) {
      await logAction(trx, userId, "budget changed", {
        projectId: task.project,
        taskId: task.task_id,
      });
    }
    if (task.value !== 0) {
      await logAction(trx, userId, "value changed", {
        projectId: task.project,
        taskId: task.task_id,
      });
    }
    await logProjectCompletion(trx, userId, task.project);

    return { project: updated };
  });

  // Throw after committing so rejected attempts keep their audit record.
  if (result.error !== undefined) ctx.throw(409, result.error);
  ctx.body = result.project;
}

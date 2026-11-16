import Router from "@koa/router";
import type { z } from "zod";

import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, idParamSchema } from "../zod/schemas.js";

import { logAction } from "../database/queries/audit_logs.js";

export const tasksRouter = new Router({ prefix: "/tasks" });

tasksRouter.use(requireAuth);

tasksRouter.post(
  "/:id/execute",
  validate({ params: idParamSchema }),
  async (ctx) => {
    const { params } = ctx.state.validated as {
      params: z.infer<typeof idParamSchema>;
    };
    const userId = ctx.session!.userId;

    const project = await ctx.database.transaction().execute(async (trx) => {
      // Lock the task row so a double-click can't execute it twice
      const task = await trx
        .selectFrom("public.tasks")
        .selectAll()
        .where("task_id", "=", params.id)
        .forUpdate()
        .executeTakeFirst();

      if (!task) return ctx.throw(404, "Task not found");
      if (task.executed) ctx.throw(409, "Task was already executed");

      // Predecessor rule
      if (task.predecessor) {
        const pred = await trx
          .selectFrom("public.tasks")
          .select(["task_name", "executed"])
          .where("task_id", "=", task.predecessor)
          .executeTakeFirstOrThrow();

        if (!pred.executed)
          ctx.throw(409, `Complete "${pred.task_name}" first`);
      }

      // Budget rule + update in ONE atomic statement:
      // the WHERE clause only matches if there's enough budget.
      const updated = await trx
        .updateTable("public.projects")
        .set((eb) => ({
          budget: eb("budget", "-", task.cost),
          value: eb("value", "+", task.value),
        }))
        .where("project_id", "=", task.project)
        .where("budget", ">=", task.cost)
        .returning(["project_id", "budget", "value"])
        .executeTakeFirst();

      if (!updated) ctx.throw(409, "Not enough budget");

      await trx
        .updateTable("public.tasks")
        .set({ executed: true })
        .where("task_id", "=", task.task_id)
        .execute();

      await logAction(trx, userId, "execute_task", {
        projectId: task.project,
        taskId: task.task_id,
      });

      return updated;
    });

    ctx.body = project; // new budget and value, so the UI can update right away
  },
);

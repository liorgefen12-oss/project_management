import Router from "@koa/router";
import type { z } from "zod";

import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, idParamSchema } from "../zod/schemas.js";

export const projectsRouter = new Router({ prefix: "/projects" });

projectsRouter.use(requireAuth); // every route in this router needs login

// List projects (for the "switch project" UI)
projectsRouter.get("/", async (ctx) => {
  ctx.body = await ctx.database
    .selectFrom("public.projects")
    .select(["project_id", "name", "budget", "value", "description"])
    .orderBy("name")
    .execute();
});

// One project: the UI needs its current budget and value
projectsRouter.get("/:id", validate({ params: idParamSchema }), async (ctx) => {
  const { params } = ctx.state.validated as {
    params: z.infer<typeof idParamSchema>;
  };

  const project = await ctx.database
    .selectFrom("public.projects")
    .select(["project_id", "name", "budget", "value", "description"])
    .where("project_id", "=", params.id)
    .executeTakeFirst();

  if (!project) ctx.throw(404, "Project not found");
  ctx.body = project;
});

// All tasks of a project, in board order
projectsRouter.get(
  "/:id/tasks",
  validate({ params: idParamSchema }),
  async (ctx) => {
    const { params } = ctx.state.validated as {
      params: z.infer<typeof idParamSchema>;
    };

    const project = await ctx.database
      .selectFrom("public.projects")
      .select("project_id")
      .where("project_id", "=", params.id)
      .executeTakeFirst();
    if (!project) ctx.throw(404, "Project not found");

    ctx.body = await ctx.database
      .selectFrom("public.tasks")
      .select([
        "task_id",
        "task_name",
        "description",
        "cost",
        "value",
        "steps",
        "predecessor",
        "executed",
        "position",
      ])
      .where("project", "=", params.id)
      .orderBy("position")
      .execute();
  },
);

import Router from "@koa/router";

import { executeTask } from "../controllers/tasks.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../zod/schemas.js";

export const tasksRouter = new Router({ prefix: "/tasks" });

tasksRouter.use(requireAuth);

tasksRouter.post("/:id/execute", validate({ params: idParamSchema }), executeTask);

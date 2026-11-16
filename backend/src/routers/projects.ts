import Router from "@koa/router";

import {
  getProject,
  listProjects,
  listProjectTasks,
  signInToProject,
  signOutOfProject,
} from "../controllers/projects.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../zod/schemas.js";

export const projectsRouter = new Router({ prefix: "/projects" });

projectsRouter.use(requireAuth); // every route in this router needs login

// List projects (for the "switch project" UI)
projectsRouter.get("/", listProjects);

// One project: the UI needs its current budget and value
projectsRouter.get("/:id", validate({ params: idParamSchema }), getProject);

// All tasks of a project, in board order
projectsRouter.get(
  "/:id/tasks",
  validate({ params: idParamSchema }),
  listProjectTasks,
);

projectsRouter.post(
  "/:id/sign-in",
  validate({ params: idParamSchema }),
  signInToProject,
);
projectsRouter.post(
  "/:id/sign-out",
  validate({ params: idParamSchema }),
  signOutOfProject,
);

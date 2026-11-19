import Router from "@koa/router";

import {
  listLogs,
  listLogsByProjectId,
  listLogsByProjectName,
} from "../controllers/audit_logs.js";
import { requireAuthentication } from "../middlewares/authRequirer.js";
import { validate } from "../middlewares/zodValidator.js";
import {
  auditLogsRequestSchema,
  idRequestSchema,
  projectNameRequestSchema,
} from "../zod/schemas.js";

export const auditLogsRouter = new Router({ prefix: "/audit-logs" });

auditLogsRouter.use(requireAuthentication);
auditLogsRouter.get("/", validate(auditLogsRequestSchema), listLogs);

auditLogsRouter.get(
  "/projects/by-name",
  validate(projectNameRequestSchema),
  listLogsByProjectName,
);
auditLogsRouter.get(
  "/projects/:id",
  validate(idRequestSchema),
  listLogsByProjectId,
);

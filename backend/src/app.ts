import cors from "@koa/cors";
import { bodyParser } from "@koa/bodyparser";
import Koa from "koa";
import helmet from "koa-helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { createSessionMiddleware } from "./middlewares/session.js";
import type { Kysely } from "kysely";
import type { Database } from "./database/db.js";
import { auditLogsRouter } from "./routers/audit_logs.js";
import { healthRouter } from "./routers/health.js";
import { projectsRouter } from "./routers/projects.js";
import { tasksRouter } from "./routers/tasks.js";
import { usersRouter } from "./routers/users.js";
import type { SessionStore } from "./sessionStore.js";

declare module "koa" {
  interface DefaultContext {
    database: Kysely<Database>;
  }
}

export interface AppOptions {
  frontendOrigin: string;
  isProduction: boolean;
  sessionSecret: string;
  sessionStore: SessionStore;
}

export function createApp(options: AppOptions) {
  const app = new Koa({ keys: [options.sessionSecret] });

  app.use(errorHandler);
  app.use(helmet());
  //CORS policy for reading different origins
  app.use(
    cors({
      origin: options.frontendOrigin,
      credentials: true,
    }),
  );
  app.use(bodyParser());
  app.use(healthRouter.routes());
  app.use(healthRouter.allowedMethods());
  //session
  app.use(
    createSessionMiddleware(app, {
      store: options.sessionStore,
      isProduction: options.isProduction,
    }),
  );

  app.use(usersRouter.routes()).use(usersRouter.allowedMethods());
  app.use(projectsRouter.routes()).use(projectsRouter.allowedMethods());
  app.use(tasksRouter.routes()).use(tasksRouter.allowedMethods());
  app.use(auditLogsRouter.routes()).use(auditLogsRouter.allowedMethods());

  return app;
}

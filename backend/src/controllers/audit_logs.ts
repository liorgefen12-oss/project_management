import type { Context } from "koa";
import type { z } from "zod";

import {
  getLogs,
  getLogsByProjectId,
  getLogsByProjectName,
} from "../database/queries/audit_logs.js";
import type {
  auditLogsRequestSchema,
  idParamSchema,
  projectNameQuerySchema,
} from "../zod/schemas.js";

type IdParams = { params: z.infer<typeof idParamSchema> };
type ProjectNameQuery = { query: z.infer<typeof projectNameQuerySchema> };

export async function listLogs(ctx: Context) {
  const { query } = ctx.state.validated as z.infer<
    typeof auditLogsRequestSchema
  >;
  ctx.body = await getLogs(ctx.database, query.type);
}

export async function listLogsByProjectId(ctx: Context) {
  const { params } = ctx.state.validated as IdParams;
  ctx.body = await getLogsByProjectId(ctx.database, params.id);
}

export async function listLogsByProjectName(ctx: Context) {
  const { query } = ctx.state.validated as ProjectNameQuery;
  ctx.body = await getLogsByProjectName(ctx.database, query.name);
}

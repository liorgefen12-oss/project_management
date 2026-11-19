import type { Context } from "koa";
import { getAllProjects } from "../../database/queries/projects.js";

export async function listProjects(ctx: Context) {
  ctx.body = await getAllProjects(ctx.database);
}

import type { Context } from "koa";
import { logProjectVisit } from "./logProjectVisit.js";

export async function signInToProject(ctx: Context) {
  await logProjectVisit(ctx, "project sign in");
}

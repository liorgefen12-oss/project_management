import type { Context } from "koa";
import { logProjectVisit } from "./logProjectVisit.js";

export async function signInToProject(ctx: Context) {
  await logProjectVisit(ctx, "project sign in");
}

export async function signOutOfProject(ctx: Context) {
  await logProjectVisit(ctx, "project sign out");
}

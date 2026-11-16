import type { Context, Next } from "koa";

export async function requireAuth(ctx: Context, next: Next) {
  if (!ctx.session?.userId) ctx.throw(401, "Not authenticated");
  await next();
}

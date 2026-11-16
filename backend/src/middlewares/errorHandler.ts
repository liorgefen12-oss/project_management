import type { Context, Next } from "koa";

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    const status = err.status ?? 500;
    ctx.status = status;
    // 4xx errors thrown with ctx.throw are safe to show; 500s are hidden
    ctx.body = { message: err.expose ? err.message : "Internal server error" };
    if (status >= 500) console.error(err);
  }
}

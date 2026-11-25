import type { Context, Next } from "koa";
import { messages } from "../messages.js";

export async function requireAuthentication(ctx: Context, next: Next) {
  if (!ctx.session?.userId) ctx.throw(401, messages[401].noLoggedInUser);
  await next();
}

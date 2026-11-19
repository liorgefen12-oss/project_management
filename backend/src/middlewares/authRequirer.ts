import type { Context, Next } from "koa";
import { messages } from "../messages.js";

export async function requireAuthentication(ctx: Context, next: Next) {
  const userId = ctx.session?.userId;
  if (!userId) ctx.throw(401, messages[401].noLoggedInUser);
  ctx.state.userId = userId; // handlers read it from here
  await next();
}

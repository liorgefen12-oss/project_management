import type { Context } from "koa";
import type { z } from "zod";
import { verifyPassword } from "../functions/passwordRules.js";
import { messages } from "../messages.js";

import { logAction } from "../database/queries/audit_logs.js";
import {
  getUserById,
  getUserWithPasswordByEmail,
} from "../database/queries/users.js";
import type { loginSchema } from "../zod/schemas.js";

const failedLogins = new Map<string, { count: number; retryAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;

function loginKey(ctx: Context, email: string) {
  return `${ctx.ip}:${email.toLowerCase()}`;
}

//user login
export async function login(ctx: Context) {
  const { body } = ctx.state.validated as { body: z.infer<typeof loginSchema> };
  const key = loginKey(ctx, body.email);
  const failures = failedLogins.get(key);
  if (failures && failures.retryAt > Date.now()) {
    ctx.set("Retry-After", String(Math.ceil((failures.retryAt - Date.now()) / 1000)));
    return ctx.throw(429, "Too many login attempts. Try again later.");
  }
  if (failures) failedLogins.delete(key);

  const user = await getUserWithPasswordByEmail(ctx.database, body.email);

  // Same message for "no such user" and "wrong password"
  if (!user || !(await verifyPassword(body.password, user.password))) {
    const previous = failedLogins.get(key);
    const count = (previous?.count ?? 0) + 1;
    failedLogins.set(key, {
      count,
      retryAt: count >= MAX_FAILED_LOGINS ? Date.now() + LOGIN_WINDOW_MS : 0,
    });
    return ctx.throw(401, messages[401].invalidCredentials);
  }

  failedLogins.delete(key);
  await logAction(ctx.database, user.user_id, "user log in");
  ctx.session = {};
  await ctx.session.regenerate();
  ctx.session!.userId = user.user_id;
  ctx.body = {
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
  };
}

//user logout
export async function logout(ctx: Context) {
  await logAction(ctx.database, ctx.session!.userId, "user log out"); // log BEFORE clearing
  ctx.session = null;
  ctx.status = 204;
}

export async function getCurrentUser(ctx: Context) {
  const user = await getUserById(ctx.database, ctx.session!.userId);

  if (!user) {
    ctx.session = null; // user was deleted, kill the stale session
    ctx.throw(401, messages[401].notAuthenticated);
  }
  ctx.body = user;
}

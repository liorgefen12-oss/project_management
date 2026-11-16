import Router from "@koa/router";
import bcrypt from "bcrypt";
import type { z } from "zod";
import { logAction } from "../database/queries/audit_logs.js";

import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../zod/schemas.js";

export const authRouter = new Router({ prefix: "/authentication" });

authRouter.post("/login", validate({ body: loginSchema }), async (ctx) => {
  const { body } = ctx.state.validated as { body: z.infer<typeof loginSchema> };

  const user = await ctx.database
    .selectFrom("public.users")
    .select(["user_id", "first_name", "last_name", "email", "password"])
    .where("email", "=", body.email)
    .executeTakeFirst();

  // Same message for "no such user" and "wrong password"
  if (!user || !(await bcrypt.compare(body.password, user.password))) {
    return ctx.throw(401, "Invalid email or password");
  }

  ctx.body = {
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
  };
});

authRouter.post("/logout", requireAuth, async (ctx) => {
  await logAction(ctx, ctx.session!.userId, "logout"); // log BEFORE clearing
  ctx.session = null;
  ctx.status = 204;
});

authRouter.get("/me", requireAuth, async (ctx) => {
  const user = await ctx.database
    .selectFrom("public.users")
    .select(["user_id", "first_name", "last_name", "email"]) // never the password
    .where("user_id", "=", ctx.session!.userId)
    .executeTakeFirst();

  if (!user) {
    ctx.session = null; // user was deleted, kill the stale session
    ctx.throw(401, "Not authenticated");
  }
  ctx.body = user;
});

import type { Context } from "koa";
import type { z } from "zod";
import { insertProject } from "../../database/queries/projects.js";
import { messages } from "../../messages.js";
import type { createProjectSchema } from "../../zod/schemas.js";

export async function createProject(ctx: Context) {
  const { body } = ctx.state.validated as {
    body: z.infer<typeof createProjectSchema>;
  };

  try {
    ctx.body = await insertProject(ctx.database, { ...body, value: 0 });
    ctx.status = 201;
  } catch (err: any) {
    if (err?.code === "23505") {
      //unique constraint violation
      ctx.throw(409, messages[409].projectAlreadyExists);
    }
    throw err;
  }
}

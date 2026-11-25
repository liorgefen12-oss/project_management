import type { Context, Next } from "koa";
import { z } from "zod";

export const validate =
  (schema: z.ZodObject) => async (ctx: Context, next: Next) => {
    const result = schema.safeParse({
      body: ctx.request.body,
      query: ctx.query,
      params: ctx.params,
    });

    if (!result.success) {
      throw result.error; // handled by errorHandler, like next(err) in Express
    }

    ctx.state.validated = result.data; // parsed, typed data
    await next();
  };

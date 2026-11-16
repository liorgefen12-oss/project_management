// validation/validate.ts
import { Context, Next } from "koa";
import { ZodSchema } from "zod";

type Targets = { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema };

export const validate =
  (schemas: Targets) => async (ctx: Context, next: Next) => {
    const validated: Record<string, unknown> = {};

    for (const key of ["body", "params", "query"] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const input =
        key === "body"
          ? ctx.request.body
          : key === "params"
            ? ctx.params
            : ctx.query;

      const result = schema.safeParse(input);
      if (!result.success) {
        ctx.status = 400;
        ctx.body = {
          message: "Invalid request",
          errors: result.error.flatten().fieldErrors,
        };
        return; // don't call next(): the request stops here
      }
      validated[key] = result.data; // cleaned/trimmed data
    }

    ctx.state.validated = validated;
    await next();
  };

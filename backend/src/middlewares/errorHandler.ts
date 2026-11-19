import type { Context, Next } from "koa";
import { z } from "zod";
import { messages } from "../messages.js";

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      //thrown from the zod validator middleware
      ctx.status = 400;
      ctx.body = {
        message: messages[400].requestFailed,
        errors: err.issues,
        errorMessages: messages[400].validationErrors(err.issues),
      };
      return;
    }
    //no 4xx status defined, so the default is a server error
    const status = err.status ?? 500;
    ctx.status = status;
    // 4xx errors thrown with ctx.throw are safe to show; 500s are hidden
    ctx.body = {
      message:
        status === 400 && err instanceof SyntaxError
          ? messages[400].malformedJson
          : err.expose
            ? err.message
            : messages[500].internalServerError,
    };
    if (status >= 500) console.error(err);
  }
}

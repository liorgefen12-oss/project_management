import session from "koa-session";
import type Koa from "koa";
import type { SessionStore } from "../sessionStore.js";

interface SessionMiddlewareOptions {
  store: SessionStore;
  isProduction: boolean;
}

export function createSessionMiddleware(
  app: Koa,
  options: SessionMiddlewareOptions,
) {
  return session(
    {
      store: options.store,
      signed: true,
      rolling: false,
      renew: false,
      httpOnly: true,
      sameSite: "lax",
      secure: options.isProduction,
      maxAge: 8 * 60 * 60 * 1000,
    },
    app,
  );
}

import session from "koa-session";
import type Koa from "koa";
import type { SessionStore } from "../sessionStore.js";

interface SessionMiddlewareOptions {
  store: SessionStore;
  secureCookies: boolean;
}

export function createSessionMiddleware(
  app: Koa,
  options: SessionMiddlewareOptions,
) {
  return session(
    {
      store: options.store, //save session data in the pg store
      signed: true, //sign
      rolling: false,
      renew: false, //dont extend session time when it expires soon
      httpOnly: true,
      sameSite: "lax", //no cross site requests
      secure: options.secureCookies,
      maxAge: 8 * 60 * 60 * 1000,
    },
    app,
  );
}

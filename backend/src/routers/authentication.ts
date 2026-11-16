import Router from "@koa/router";

import { getCurrentUser, login, logout } from "../controllers/users.js";
import { requireAuthentication } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../zod/schemas.js";

export const usersRouter = new Router({ prefix: "/users" });

usersRouter.post("/login", validate({ body: loginSchema }), login);
usersRouter.post("/logout", requireAuthentication, logout);
usersRouter.get("/currentuser", requireAuthentication, getCurrentUser);

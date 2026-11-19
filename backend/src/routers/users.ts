import Router from "@koa/router";

import { getCurrentUser, login, logout } from "../controllers/users.js";
import { requireAuthentication } from "../middlewares/authRequirer.js";
import { validate } from "../middlewares/zodValidator.js";
import { loginRequestSchema } from "../zod/schemas.js";

export const usersRouter = new Router({ prefix: "/users" });

usersRouter.post("/login", validate(loginRequestSchema), login);
usersRouter.post("/logout", requireAuthentication, logout);
usersRouter.get("/me", requireAuthentication, getCurrentUser);

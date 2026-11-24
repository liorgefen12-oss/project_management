import type { Context } from "koa";
import bcrypt from "bcryptjs";
import type { Kysely } from "kysely";
import request from "supertest";
import { vi } from "vitest";
import { createApp } from "../../app.js";
import type { Database } from "../../database/db.js";
import {
  getLogs,
  getLogsByProjectId,
  getLogsByProjectName,
  logAction,
} from "../../database/queries/audit_logs.js";
import {
  getUserById,
  getUserWithPasswordByEmail,
} from "../../database/queries/users.js";
import { login } from "../../controllers/users.js";
import type { SessionStore } from "../../sessionStore.js";

export {
  //make the imported functions available to other files through this helper file
  //vi.mock will create mocks for this imported function
  getLogs,
  getLogsByProjectId,
  getLogsByProjectName,
  getUserById,
  getUserWithPasswordByEmail,
  logAction,
  login,
};

//------ provides sample data and helper functions for login tests.

export const user = {
  user_id: "00000000-0000-4000-8000-000000000001",
  first_name: "Test",
  last_name: "User",
  email: "test@outlook.com",
  password: "",
};
export const loginPassword = "correct-password";
export const loggedInUser = {
  user_id: user.user_id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
};
//reates a small fake Koa context so a test can call login directly.
export function createContext(password = loginPassword) {
  let session: Record<string, unknown> = {}; //hold session data
  const regenerate = vi.fn().mockResolvedValue(undefined); //mock session regeneration function
  return {
    state: {
      validated: {
        body: { email: user.email, password },
      },
    },
    database: {},
    get session() {
      return Object.assign(session, { regenerate });
      //assign the regenerated session values to the current session,
      //and then return it (getter function)
    },
    set session(value: Record<string, unknown>) {
      session = value;
    },
    throw(status: number, message: string): never {
      //this functions always throws - no return value of any kind.
      throw Object.assign(new Error(message), { status });
    },
  } as unknown as Context; //treat the object as koa context
}

//fake app for sending http requests
export function createUserApp() {
  const sessions = new Map<string, unknown>();
  const sessionStore: SessionStore = {
    get: async (key) => sessions.get(key),
    set: async (key, session) => {
      sessions.set(key, session);
    },
    destroy: async (key) => {
      sessions.delete(key);
    },
  };
  const app = createApp({
    frontendOrigin: "http://localhost:5173",
    secureCookies: false,
    sessionSecret: "hgutmtg7bKgtYjBfThJjJjJGRCHU464v3GJI6ghfB1!",
    sessionStore,
  });
  app.context.database = {} as Kysely<Database>;
  return {
    app,
    agent: request.agent(app.callback()), //supertest client to send requests and keep cookies and sessions in between
    sessions,
  };
}

export async function configureValidLogin() {
  //when this exported function is used, in other test files, it provides a valid, hashed, correct user password
  vi.mocked(getUserWithPasswordByEmail).mockResolvedValue({
    ...user,
    password: await bcrypt.hash(loginPassword, 4),
    //hash the correct password
    //with bcrypt cost = 4 (low cost, good for tests)
  });
  vi.mocked(getUserById).mockResolvedValue(loggedInUser);
  return loginPassword;
}

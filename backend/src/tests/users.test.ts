import type { Context } from "koa";
import bcrypt from "bcryptjs";
import type { Kysely } from "kysely";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../app.js";
import type { Database } from "../database/db.js";
import {
  getLogs,
  getLogsByProjectId,
  getLogsByProjectName,
  logAction,
} from "../database/queries/audit_logs.js";
import {
  getUserById,
  getUserWithPasswordByEmail,
} from "../database/queries/users.js";
import { login } from "../controllers/users.js";
import type { SessionStore } from "../sessionStore.js";

vi.mock("../database/queries/users.js", () => ({
  getUserWithPasswordByEmail: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("../database/queries/audit_logs.js", () => ({
  logAction: vi.fn(),
  getLogs: vi.fn(),
  getLogsByProjectId: vi.fn(),
  getLogsByProjectName: vi.fn(),
}));

const user = {
  user_id: "00000000-0000-4000-8000-000000000001",
  first_name: "Test",
  last_name: "User",
  email: "test@outlook.com",
  password: "",
};

function createContext(password = "correct-password") {
  let session: Record<string, unknown> = {};
  const regenerate = vi.fn().mockResolvedValue(undefined);
  return {
    state: {
      validated: {
        body: { email: user.email, password },
      },
    },
    database: {},
    get session() {
      return Object.assign(session, { regenerate });
    },
    set session(value: Record<string, unknown>) {
      session = value;
    },
    throw(status: number, message: string): never {
      throw Object.assign(new Error(message), { status });
    },
  } as unknown as Context;
}

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the authenticated user id in the session", async () => {
    const password = "correct-password";
    vi.mocked(getUserWithPasswordByEmail).mockResolvedValue({
      ...user,
      password: await bcrypt.hash(password, 4),
    });
    const ctx = createContext(password);
    await login(ctx);

    expect(ctx.session?.userId).toBe(user.user_id);
    expect(ctx.session?.regenerate).toHaveBeenCalledOnce();
    expect(ctx.body).toEqual({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });
  });

  it("does not authenticate when the password is incorrect", async () => {
    vi.mocked(getUserWithPasswordByEmail).mockResolvedValue({
      ...user,
      password: await bcrypt.hash("different-password", 4),
    });
    const ctx = createContext("correct-password");

    await expect(login(ctx)).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });

    expect(ctx.session?.userId).toBeUndefined();
  });

  it("keeps the session from login for the next authenticated request", async () => {
    const password = "correct-password";
    const projectId = "00000000-0000-4000-8000-000000000003";
    const passwordHash = await bcrypt.hash(password, 4);
    const loggedInUser = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    };
    vi.mocked(getUserWithPasswordByEmail).mockResolvedValue({
      ...user,
      password: passwordHash,
    });
    vi.mocked(getUserById).mockResolvedValue(loggedInUser);
    const logs = [
      {
        log_id: "00000000-0000-4000-8000-000000000002",
        project_id: projectId,
        task_id: null,
        user_id: user.user_id,
        action_id: 1,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];
    vi.mocked(getLogs).mockResolvedValue(logs);
    vi.mocked(getLogsByProjectId).mockResolvedValue(logs);
    vi.mocked(getLogsByProjectName).mockResolvedValue(logs);

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
      isProduction: false,
      sessionSecret: "test-secret-with-more-than-thirty-two-characters",
      sessionStore,
    });
    app.context.database = {} as Kysely<Database>;

    const agent = request.agent(app.callback());
    const loginResponse = await agent
      .post("/users/login")
      .send({ email: user.email, password });
    const currentUserResponse = await agent.get("/users/me");
    const auditLogsResponse = await agent.get("/audit-logs");
    const logsByProjectIdResponse = await agent.get(
      `/audit-logs/projects/${projectId}`,
    );
    const logsByProjectNameResponse = await agent
      .get("/audit-logs/projects/by-name")
      .query({ name: "Main project" });
    const userLoginsResponse = await agent
      .get("/audit-logs")
      .query({ type: "user-logins" });
    const projectEventsResponse = await agent
      .get("/audit-logs")
      .query({ type: "project-sign-ins-and-outs" });
    const invalidAuditTypeResponse = await agent
      .get("/audit-logs")
      .query({ type: "unknown" });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers["set-cookie"]).toBeDefined();
    expect(currentUserResponse.status).toBe(200);
    expect(currentUserResponse.body).toEqual(loggedInUser);
    expect(auditLogsResponse.status).toBe(200);
    expect(auditLogsResponse.body).toEqual([
      {
        ...logs[0],
        created_at: logs[0].created_at.toISOString(),
      },
    ]);
    expect(logsByProjectIdResponse.status).toBe(200);
    expect(logsByProjectIdResponse.body).toEqual(auditLogsResponse.body);
    expect(logsByProjectNameResponse.status).toBe(200);
    expect(logsByProjectNameResponse.body).toEqual(auditLogsResponse.body);
    expect(userLoginsResponse.status).toBe(200);
    expect(userLoginsResponse.body).toEqual(auditLogsResponse.body);
    expect(projectEventsResponse.status).toBe(200);
    expect(projectEventsResponse.body).toEqual(auditLogsResponse.body);
    expect(invalidAuditTypeResponse.status).toBe(400);

    expect(getLogs).toHaveBeenCalledWith(expect.anything(), undefined);
    expect(getLogsByProjectId).toHaveBeenCalledWith(
      expect.anything(),
      projectId,
    );
    expect(getLogsByProjectName).toHaveBeenCalledWith(
      expect.anything(),
      "Main project",
    );
    expect(getLogs).toHaveBeenCalledWith(expect.anything(), "user-logins");
    expect(getLogs).toHaveBeenCalledWith(
      expect.anything(),
      "project-sign-ins-and-outs",
    );
    expect(logAction).toHaveBeenCalledWith(
      expect.anything(),
      user.user_id,
      "user log in",
    );
    expect(getUserById).toHaveBeenCalledWith(expect.anything(), user.user_id);

    const oldKeys = [...sessions.keys()];
    const oldCookies = loginResponse.headers["set-cookie"];
    expect(oldKeys).toHaveLength(1);
    const oldSession = sessions.get(oldKeys[0]);
    if (!oldSession || typeof oldSession !== "object") {
      throw new Error("Expected a persisted session");
    }
    Object.assign(oldSession, { staleField: "discard on login" });
    const secondLogin = await agent
      .post("/users/login")
      .send({ email: user.email, password });

    expect(secondLogin.status).toBe(200);
    expect(sessions.size).toBe(1);
    expect(sessions.has(oldKeys[0])).toBe(false);
    expect([...sessions.values()][0]).not.toHaveProperty("staleField");
    expect((await agent.get("/users/me")).status).toBe(200);
    expect((await request(app.callback())
      .get("/users/me")
      .set("Cookie", oldCookies)).status).toBe(401);
  });

  it("requires authentication to list audit logs", async () => {
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
      isProduction: false,
      sessionSecret: "test-secret-with-more-than-thirty-two-characters",
      sessionStore,
    });

    const response = await request(app.callback()).get("/audit-logs");

    expect(response.status).toBe(401);
    expect(getLogs).not.toHaveBeenCalled();
  });
});

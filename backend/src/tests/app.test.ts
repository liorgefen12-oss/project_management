import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import type { SessionStore } from "../sessionStore.js";

const sessions = new Map<string, unknown>();
const memoryStore: SessionStore = {
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
  sessionStore: memoryStore,
});

describe("GET /health", () => {
  it("returns an OK status without requiring a database connection", async () => {
    const response = await request(app.callback()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("applies security and CORS headers without creating a session", async () => {
    const response = await request(app.callback())
      .get("/health")
      .set("Origin", "http://localhost:5173");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["set-cookie"]).toBeUndefined();
  });
});

describe("sessions", () => {
  it("persists session data in the configured store across requests", async () => {
    const sessionApp = createApp({
      frontendOrigin: "http://localhost:5173",
      isProduction: false,
      sessionSecret: "test-secret-with-more-than-thirty-two-characters",
      sessionStore: memoryStore,
    });

    sessionApp.use((ctx) => {
      if (!ctx.session) throw new Error("Session is unavailable");
      ctx.session.visits = Number(ctx.session.visits ?? 0) + 1;
      ctx.body = { visits: ctx.session.visits };
    });

    const agent = request.agent(sessionApp.callback());
    const first = await agent.get("/");
    const second = await agent.get("/");

    expect(first.body).toEqual({ visits: 1 });
    expect(first.headers["set-cookie"]).toBeDefined();
    expect(second.body).toEqual({ visits: 2 });
  });
});

describe("request error messages", () => {
  it("returns centralized validation messages alongside structured issues", async () => {
    const response = await request(app.callback())
      .post("/users/login")
      .send({ email: "not-an-email", password: "" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid request");
    expect(response.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ["body", "password"], message: "Password is required" }),
    ]));
    expect(response.body.errorMessages).toContain("Password is required");
  });

  it("uses the malformed JSON message for invalid request JSON", async () => {
    const response = await request(app.callback())
      .post("/users/login")
      .set("Content-Type", "application/json")
      .send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Request body contains invalid JSON, please check for typos",
    });
  });
});

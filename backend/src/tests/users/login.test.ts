import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../database/queries/users.js", () => ({
  getUserWithPasswordByEmail: vi.fn(),
  getUserById: vi.fn(),
}));
vi.mock("../../database/queries/audit_logs.js", () => ({
  logAction: vi.fn(),
  getLogs: vi.fn(),
  getLogsByProjectId: vi.fn(),
  getLogsByProjectName: vi.fn(),
}));

import {
  configureValidLogin,
  createContext,
  createUserApp,
  getUserById,
  getUserWithPasswordByEmail,
  loggedInUser,
  login,
  logAction,
  user,
} from "./userUtilities.js";

describe("user login", () => {
  beforeEach(() => vi.clearAllMocks());

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

  it("keeps the login session for the next /users/me request", async () => {
    const { agent } = createUserApp();
    const password = await configureValidLogin();
    const loginResponse = await agent
      .post("/users/login")
      .send({ email: user.email, password });
    const currentUserResponse = await agent.get("/users/me");

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers["set-cookie"]).toBeDefined();
    expect(currentUserResponse.status).toBe(200);
    expect(currentUserResponse.body).toEqual(loggedInUser);
    expect(getUserById).toHaveBeenCalledWith(expect.anything(), user.user_id);
    expect(logAction).toHaveBeenCalledWith(
      expect.anything(),
      user.user_id,
      "user log in",
    );
  });
});

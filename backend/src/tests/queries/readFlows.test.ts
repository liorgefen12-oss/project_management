import Koa from "koa";
import session from "koa-session";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { areAllProjectTasksExecuted } from "../../database/queries/projects.js";
import { isTaskProjectCompleted } from "../../functions/taskExecutionRules.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { projectsRouter } from "../../routers/projects.js";
import { tasksRouter } from "../../routers/tasks.js";
import {
  emptyProjectId,
  firstId,
  missingId,
  otherId,
  otherProjectId,
  projectId,
  secondId,
  thirdId,
  useQueryDatabase,
} from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL read flows", () => {
  const getDatabase = useQueryDatabase();

  function client() {
    const app = new Koa();
    app.context.database = getDatabase();
    app.use(errorHandler);
    app.use(session({ signed: false }, app));
    app.use(async (ctx, next) => {
      ctx.session!.userId = firstId;
      await next();
    });
    app.use(tasksRouter.routes());
    app.use(projectsRouter.routes());
    return request(app.callback());
  }

  it("retrieves task fields by ID without embedding predecessor data", async () => {
    const response = await client().get(`/tasks/${thirdId}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      task_id: thirdId, project: projectId, cost: 10, value: 4,
    });
    expect(response.body).not.toHaveProperty("predecessor_ids");
    expect((await client().get(`/tasks/${missingId}`)).status).toBe(404);
  });

  it("returns flat recursive predecessor rows and uses the entire chain for executability", async () => {
    const response = await client().get(`/tasks/${thirdId}/predecessors`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { task_id: secondId, executed: true },
      { task_id: firstId, executed: false },
    ]);
    expect((await client().get(`/tasks/${thirdId}/executable`)).text).toBe("false");
    await getDatabase().updateTable("public.tasks").set({ executed: true })
      .where("task_id", "=", firstId).execute();
    expect((await client().get(`/tasks/${thirdId}/executable`)).text).toBe("true");
    await getDatabase().updateTable("public.projects").set({ budget: 9 })
      .where("project_id", "=", projectId).execute();
    expect((await client().get(`/tasks/${thirdId}/executable`)).text).toBe("false");
  });

  it("retrieves a project by its unique name, including budget and value", async () => {
    const response = await client().get("/projects/by-name").query({ name: " Main project " });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      project_id: projectId, name: "Main project", budget: 100, value: 100,
    });
    expect((await client().get("/projects/by-name").query({ name: "' OR true --" })).status)
      .toBe(404);
  });

  it("retrieves the full owning project by task ID", async () => {
    const response = await client().get(`/projects/by-task/${otherId}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ project_id: otherProjectId, budget: 100, value: 100 });
    expect((await client().get(`/projects/by-task/${missingId}`)).status).toBe(404);
  });

  it.each([
    [undefined, [firstId, secondId, thirdId]],
    ["true", [secondId]],
    ["false", [firstId, thirdId]],
  ])("returns board tasks for executed=%s without changing their shape", async (executed, ids) => {
    const response = await client().get(`/projects/${projectId}/tasks`)
      .query(executed === undefined ? {} : { executed });
    expect(response.status).toBe(200);
    expect(response.body.map((task: { task_id: string }) => task.task_id)).toEqual(ids);
    for (const task of response.body) {
      expect(task).not.toHaveProperty("predecessor_ids");
      expect(task).toHaveProperty("cost");
      expect(task).toHaveProperty("value");
      expect(task).not.toHaveProperty("project");
    }
    expect((await client().get(`/projects/${missingId}/tasks`)).status).toBe(404);
  });

  it("requires at least one task and every task executed for completion", async () => {
    expect(await areAllProjectTasksExecuted(getDatabase(), missingId)).toBe(false);
    expect(await areAllProjectTasksExecuted(getDatabase(), emptyProjectId)).toBe(false);
    expect((await client().get(`/projects/${emptyProjectId}/completed`)).body)
      .toEqual({ project_id: emptyProjectId, completed: false });
    expect((await client().get(`/projects/${projectId}/completed`)).body)
      .toEqual({ project_id: projectId, completed: false });
    await getDatabase().updateTable("public.tasks").set({ executed: true })
      .where("project", "=", projectId).execute();
    const completed = await client().get(`/projects/${projectId}/completed`);
    expect(completed.status).toBe(200);
    expect(completed.body).toEqual({ project_id: projectId, completed: true });
    expect((await client().get(`/projects/${missingId}/completed`)).status).toBe(404);
  });

  it("determines completion from a task's owning project, not from other projects", async () => {
    const db = getDatabase();
    expect(await isTaskProjectCompleted(db, secondId)).toBe(false);
    await db.updateTable("public.tasks").set({ executed: true })
      .where("project", "=", otherProjectId).execute();
    expect(await isTaskProjectCompleted(db, otherId)).toBe(true);
    expect(await isTaskProjectCompleted(db, secondId)).toBe(false);
    await db.updateTable("public.tasks").set({ executed: true })
      .where("project", "=", projectId).execute();
    expect(await isTaskProjectCompleted(db, firstId)).toBe(true);
    await expect(isTaskProjectCompleted(db, missingId)).rejects.toMatchObject({
      status: 404, message: "Task not found",
    });
  });
});

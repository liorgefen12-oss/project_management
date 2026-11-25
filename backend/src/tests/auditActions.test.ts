import Koa from "koa";
import { bodyParser } from "@koa/bodyparser";
import session from "koa-session";
import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database, Project, Task } from "../database/types.js";
import { logAction } from "../database/queries/audit_logs.js";
import {
  areAllProjectTasksExecuted,
  getProjectById,
  getProjectByIdForUpdate,
  projectExists,
  spendBudgetOnTask,
  insertProject,
  updateProject,
} from "../database/queries/projects.js";
import {
  getTaskByIdForUpdate,
  getTaskById,
  getTaskProjectBudget,
  getTaskAllPredecessors,
  areTaskPredecessorsExecuted,
  getTaskProject,
  insertTask,
  markExecuted,
  lockProjectTaskChanges,
  updateTask,
  updateTaskPosition,
  getProjectBoardTasks,
  getProjectTaskPredecessors,
} from "../database/queries/tasks.js";
import { projectsRouter } from "../routers/projects.js";
import { tasksRouter } from "../routers/tasks.js";
import { errorHandler } from "../middlewares/errorHandler.js";

vi.mock("../database/queries/audit_logs.js", () => ({
  logAction: vi.fn(),
}));
vi.mock("../database/queries/projects.js", () => ({
  areAllProjectTasksExecuted: vi.fn(),
  projectExists: vi.fn(),
  spendBudgetOnTask: vi.fn(),
  getAllProjects: vi.fn(),
  getProjectById: vi.fn(),
  getProjectByIdForUpdate: vi.fn(),
  insertProject: vi.fn(),
  updateProject: vi.fn(),
  refreshProjectGoalsMet: vi.fn(),
}));
vi.mock("../database/queries/tasks.js", () => ({
  getTaskByIdForUpdate: vi.fn(),
  getTaskById: vi.fn(),
  getTaskAllPredecessors: vi.fn(),
  areTaskPredecessorsExecuted: vi.fn(),
  getTaskProject: vi.fn(),
  insertTask: vi.fn(),
  markExecuted: vi.fn(),
  getTaskProjectBudget: vi.fn(),
  getProjectBoardTasks: vi.fn(),
  getProjectTaskPredecessors: vi.fn(),
  lockProjectTaskChanges: vi.fn(),
  updateTask: vi.fn(),
  updateTaskPosition: vi.fn(),
}));

const userId = "00000000-0000-4000-8000-000000000001";
const projectId = "00000000-0000-4000-8000-000000000002";
const taskId = "00000000-0000-4000-8000-000000000003";
const task: Task = {
  task_id: taskId,
  task_name: "Test task",
  description: "",
  project: projectId,
  cost: 10,
  value: 5,
  steps: 1,
  position: 1,
  executed: false,
};
const boardTask = {
  ...task,
  predecessor_ids: [],
} satisfies Awaited<ReturnType<typeof getProjectBoardTasks>>[number];
const updatedProject = { project_id: projectId, budget: 90, value: 5 };
const driver = new DummyDriver();
const commitTransaction = vi.spyOn(driver, "commitTransaction");
const rollbackTransaction = vi.spyOn(driver, "rollbackTransaction");
const database = new Kysely<Database>({
  dialect: {
    createDriver: () => driver,
    createAdapter: () => new PostgresAdapter(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createIntrospector: (db) => new PostgresIntrospector(db),
  },
});
const app = new Koa();
app.context.database = database;
app.use(errorHandler);
app.use(bodyParser());
app.use(session({ signed: false }, app));
app.use(async (ctx, next) => {
  ctx.session!.userId = userId;
  await next();
});
app.use(projectsRouter.routes());
app.use(tasksRouter.routes());

describe("controller audit actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(projectExists).mockResolvedValue(true);
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue(task);
    vi.mocked(getTaskById).mockResolvedValue(task);
    vi.mocked(getTaskProjectBudget).mockResolvedValue({
      budget: updatedProject.budget,
    });
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([]);
    vi.mocked(areTaskPredecessorsExecuted).mockResolvedValue(true);
    vi.mocked(getTaskProject).mockResolvedValue(projectId);
    vi.mocked(getProjectBoardTasks).mockResolvedValue([boardTask]);
    vi.mocked(getProjectTaskPredecessors).mockResolvedValue([]);
    vi.mocked(getProjectById).mockResolvedValue({
      ...updatedProject,
      name: "Project",
      description: "",
      goals: null,
      goals_met: null,
    });
    vi.mocked(getProjectByIdForUpdate).mockResolvedValue({
      ...updatedProject,
      name: "Project",
      description: "",
      goals: null,
      goals_met: null,
    });
    vi.mocked(spendBudgetOnTask).mockResolvedValue(updatedProject);
    vi.mocked(areAllProjectTasksExecuted).mockResolvedValue(false);
  });

  it.each([
    ["sign-in", "project sign in"],
    ["sign-out", "project sign out"],
  ])("logs project %s with its user and project", async (path, action) => {
    const response = await request(app.callback()).post(
      `/projects/${projectId}/${path}`,
    );

    expect(response.status).toBe(204);
    expect(logAction).toHaveBeenCalledWith(database, userId, action, {
      projectId,
    });
  });

  it("does not log a visit to a missing project", async () => {
    vi.mocked(projectExists).mockResolvedValue(false);

    const response = await request(app.callback()).post(
      `/projects/${projectId}/sign-in`,
    );

    expect(response.status).toBe(404);
    expect(logAction).not.toHaveBeenCalled();
  });

  it("logs task completion and budget/value changes without premature project completion", async () => {
    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedProject);
    expect(vi.mocked(logAction).mock.calls.map((call) => call[2])).toEqual([
      "task completed",
      "budget changed",
      "value changed",
    ]);
    for (const [db, actor, , ids] of vi.mocked(logAction).mock.calls) {
      expect(db.isTransaction).toBe(true);
      expect(actor).toBe(userId);
      expect(ids).toEqual({ projectId, taskId });
    }
  });

  it("logs project completion when the last task executes", async () => {
    vi.mocked(areAllProjectTasksExecuted).mockResolvedValue(true);

    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );

    expect(response.status).toBe(200);
    expect(logAction).toHaveBeenLastCalledWith(
      expect.anything(),
      userId,
      "project completed",
      { projectId },
    );
  });

  it.each([
    {
      reason: "predecessor",
      message: 'Complete "Earlier task" first',
      configure: () => {
        vi.mocked(areTaskPredecessorsExecuted).mockResolvedValue(false);
        vi.mocked(getTaskAllPredecessors).mockResolvedValue([
          { task_id: userId, executed: true },
          { task_id: projectId, executed: false },
        ]);
        vi.mocked(getTaskById).mockResolvedValue({
          ...task,
          task_name: "Earlier task",
        });
      },
    },
    {
      reason: "budget",
      message: "Not enough budget",
      configure: () => {
        vi.mocked(spendBudgetOnTask).mockResolvedValue(undefined);
      },
    },
  ])(
    "logs a task blocked by $reason without executing it",
    async ({ configure, message }) => {
      configure();

      const response = await request(app.callback()).post(
        `/tasks/${taskId}/execute`,
      );

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(message);
      expect(logAction).toHaveBeenCalledExactlyOnceWith(
        expect.anything(),
        userId,
        "popup - unavailable task",
        { projectId, taskId },
      );
      expect(markExecuted).not.toHaveBeenCalled();
      expect(areAllProjectTasksExecuted).not.toHaveBeenCalled();
      expect(commitTransaction).toHaveBeenCalledOnce();
      expect(rollbackTransaction).not.toHaveBeenCalled();
    },
  );

  it("rolls back task execution if auditing fails", async () => {
    vi.mocked(logAction).mockRejectedValue(new Error("Audit write failed"));
    const onError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await request(app.callback()).post(
        `/tasks/${taskId}/execute`,
      );

      expect(response.status).toBe(500);
      expect(commitTransaction).not.toHaveBeenCalled();
      expect(rollbackTransaction).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalled();
    } finally {
      onError.mockRestore();
    }
  });

  it("blocks cyclic dependencies even when the returned predecessors are all executed", async () => {
    vi.mocked(areTaskPredecessorsExecuted).mockResolvedValue(false);
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([
      { task_id: userId, executed: true },
    ]);
    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );
    expect(response.status).toBe(409);
    expect(response.body.message).toBe(
      "Task predecessors must exist and be executed without cycles",
    );
    expect(markExecuted).not.toHaveBeenCalled();
    expect(spendBudgetOnTask).not.toHaveBeenCalled();
    expect(commitTransaction).toHaveBeenCalledOnce();
  });

  it("uses the budget rule's reason and does not update anything when it rejects execution", async () => {
    vi.mocked(getTaskProjectBudget).mockResolvedValue({ budget: 9 });
    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: "Not enough budget" });
    expect(spendBudgetOnTask).not.toHaveBeenCalled();
    expect(markExecuted).not.toHaveBeenCalled();
    expect(logAction).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      userId,
      "popup - unavailable task",
      { projectId, taskId },
    );
  });

  it("rejects repeated execution through the combined rule without another audit event", async () => {
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({
      ...task,
      executed: true,
    });
    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: "Task was already executed" });
    expect(spendBudgetOnTask).not.toHaveBeenCalled();
    expect(markExecuted).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it("does not log budget/value changes when both stay unchanged", async () => {
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({
      ...task,
      cost: 0,
      value: 0,
    });

    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(logAction).mock.calls.map((call) => call[2])).toEqual([
      "task completed",
    ]);
  });

  it("executes a task only after all predecessor branches are complete", async () => {
    vi.mocked(areTaskPredecessorsExecuted).mockResolvedValue(true);

    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );
    expect(response.status).toBe(200);
    expect(markExecuted).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ isTransaction: true }),
      taskId,
    );
    expect(areTaskPredecessorsExecuted).toHaveBeenCalledWith(
      expect.objectContaining({ isTransaction: true }),
      taskId,
      [],
    );
  });

  it("lists the predecessor graph without changing task state", async () => {
    const predecessors = [{ task_id: userId, executed: true }];
    vi.mocked(getTaskAllPredecessors).mockResolvedValue(predecessors);

    const response = await request(app.callback()).get(
      `/tasks/${taskId}/predecessors`,
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual(predecessors);
    expect(markExecuted).not.toHaveBeenCalled();
  });

  it.each([
    ["ready", true],
    ["unfinished", false],
    ["missing", false],
    ["budget", false],
    ["executed", false],
    ["cycle", false],
  ])("reports executable status for a %s task", async (reason, executable) => {
    vi.mocked(getTaskById).mockResolvedValue({
      ...task,
      executed: reason === "executed",
    });
    vi.mocked(areTaskPredecessorsExecuted).mockResolvedValue(
      !["unfinished", "missing", "cycle"].includes(reason),
    );
    if (reason === "budget") {
      vi.mocked(getTaskProjectBudget).mockResolvedValue({ budget: 9 });
    }

    const response = await request(app.callback()).get(
      `/tasks/${taskId}/executable`,
    );
    expect(response.status).toBe(200);
    expect(response.text).toBe(JSON.stringify(executable));
    expect(spendBudgetOnTask).not.toHaveBeenCalled();
    expect(markExecuted).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });

  it.each(["predecessors", "executable"])(
    "validates IDs and missing tasks for the %s endpoint",
    async (endpoint) => {
      expect(
        (await request(app.callback()).get(`/tasks/not-a-uuid/${endpoint}`))
          .status,
      ).toBe(400);
      vi.mocked(getTaskById).mockResolvedValue(undefined);
      expect(
        (await request(app.callback()).get(`/tasks/${taskId}/${endpoint}`))
          .status,
      ).toBe(404);
    },
  );

  it("requires authentication for the new read endpoints", async () => {
    const anonymousApp = new Koa();
    anonymousApp.use(tasksRouter.routes());
    for (const endpoint of ["predecessors", "executable"]) {
      expect(
        (
          await request(anonymousApp.callback()).get(
            `/tasks/${taskId}/${endpoint}`,
          )
        ).status,
      ).toBe(401);
    }
    expect(getTaskById).not.toHaveBeenCalled();
  });

  const taskBody = {
    task_name: "New task",
    description: "",
    cost: 1,
    value: 1,
    steps: 1,
    position: 3,
    project: projectId,
  };

  it.each([
    { predecessor_ids: undefined },
    { predecessor_ids: [] },
    { predecessor_ids: [userId] },
  ])("creates a task with dependencies %j", async ({ predecessor_ids }) => {
    const created = { ...task };
    vi.mocked(insertTask).mockResolvedValue(created);
    if (predecessor_ids?.length) {
      vi.mocked(getProjectBoardTasks).mockResolvedValue([
        { ...boardTask, position: 1 },
        { ...boardTask, task_id: userId, position: 2 },
      ]);
    }
    const response = await request(app.callback())
      .post("/tasks/")
      .send({ ...taskBody, predecessor_ids });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(insertTask).toHaveBeenCalledWith(
      expect.objectContaining({ isTransaction: true }),
      taskBody,
      predecessor_ids ?? [],
    );
    expect(logAction).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ isTransaction: true }),
      userId,
      "task created",
      { projectId: created.project, taskId: created.task_id },
    );
    expect(vi.mocked(logAction).mock.calls[0]![0]).toBe(
      vi.mocked(insertTask).mock.calls[0]![0],
    );
    expect(commitTransaction).toHaveBeenCalledOnce();
  });

  it("rolls back task creation if auditing fails", async () => {
    vi.mocked(insertTask).mockResolvedValue(task);
    vi.mocked(logAction).mockRejectedValue(new Error("Audit write failed"));
    const onError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await request(app.callback())
        .post("/tasks/")
        .send(taskBody);

      expect(response.status).toBe(500);
      expect(insertTask).toHaveBeenCalledOnce();
      expect(commitTransaction).not.toHaveBeenCalled();
      expect(rollbackTransaction).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalled();
    } finally {
      onError.mockRestore();
    }
  });

  it("does not audit a task whose insert fails", async () => {
    vi.mocked(insertTask).mockRejectedValue({ code: "23505" });
    const response = await request(app.callback())
      .post("/tasks/")
      .send(taskBody);

    expect(response.status).toBe(409);
    expect(logAction).not.toHaveBeenCalled();
    expect(commitTransaction).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledOnce();
  });

  it.each([
    { predecessor_ids: [userId, userId] },
    { predecessor_ids: ["invalid"] },
    { predecessor_ids: null },
    { predecessor: userId },
  ])(
    "rejects malformed or legacy dependency input: %j",
    async (dependencies) => {
      const response = await request(app.callback())
        .post("/tasks/")
        .send({ ...taskBody, ...dependencies });
      expect(response.status).toBe(400);
      expect(insertTask).not.toHaveBeenCalled();
      expect(logAction).not.toHaveBeenCalled();
    },
  );

  it.each([
    [undefined, 404],
    [taskId, 400],
  ])(
    "rejects a missing or cross-project predecessor (%s)",
    async (project, status) => {
      vi.mocked(getTaskProject)
        .mockResolvedValueOnce(projectId)
        .mockResolvedValueOnce(project);
      const response = await request(app.callback())
        .post("/tasks/")
        .send({ ...taskBody, predecessor_ids: [userId, taskId] });
      expect(response.status).toBe(status);
      expect(insertTask).not.toHaveBeenCalled();
      expect(logAction).not.toHaveBeenCalled();
      expect(rollbackTransaction).toHaveBeenCalledOnce();
    },
  );

  it("edits task fields and replaces dependencies in a transaction", async () => {
    const edited = { ...task, task_name: "Edited" };
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({
      ...task,
      position: 2,
    });
    vi.mocked(getProjectBoardTasks).mockResolvedValue([
      { ...boardTask, task_id: userId, position: 1 },
      { ...boardTask, position: 2 },
    ]);
    vi.mocked(updateTask).mockResolvedValue(edited);
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send({ task_name: "Edited", predecessor_ids: [userId] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Task updated successfully",
      task: edited,
    });
    expect(lockProjectTaskChanges).toHaveBeenCalledWith(
      expect.anything(),
      projectId,
    );
    expect(updateTask).toHaveBeenCalledWith(
      expect.objectContaining({ isTransaction: true }),
      taskId,
      { task_name: "Edited" },
      [userId],
    );
    expect(commitTransaction).toHaveBeenCalledOnce();
  });

  it("allows removing all predecessors without changing task fields", async () => {
    vi.mocked(updateTask).mockResolvedValue(task);
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send({ predecessor_ids: [] });
    expect(response.status).toBe(200);
    expect(updateTask).toHaveBeenCalledWith(expect.anything(), taskId, {}, []);
  });

  it("uses zero as the initial project value", async () => {
    const newProject = {
      project_id: projectId,
      name: "New project",
      description: "",
      budget: 10,
      value: 0,
      goals: null,
      goals_met: null,
    };
    vi.mocked(insertProject).mockResolvedValue(newProject);
    const response = await request(app.callback())
      .post("/projects/")
      .send({ name: "New project", description: "", budget: 10 });
    expect(response.status).toBe(201);
    expect(insertProject).toHaveBeenCalledWith(expect.anything(), {
      name: "New project",
      description: "",
      budget: 10,
      value: 0,
    });
  });

  it("passes project goals through to the insert and rejects malformed goals", async () => {
    const goals = { steps: 12, cost: 800 };
    vi.mocked(insertProject).mockResolvedValue({
      project_id: projectId,
      name: "Goal project",
      description: "",
      budget: 10,
      value: 0,
      goals,
      goals_met: null,
    });
    const created = await request(app.callback())
      .post("/projects/")
      .send({ name: "Goal project", description: "", budget: 10, goals });
    expect(created.status).toBe(201);
    expect(insertProject).toHaveBeenCalledWith(expect.anything(), {
      name: "Goal project",
      description: "",
      budget: 10,
      goals,
      value: 0,
    });

    const rejected = await request(app.callback())
      .post("/projects/")
      .send({
        name: "Bad goals",
        description: "",
        budget: 10,
        goals: { steps: 3 },
      });
    expect(rejected.status).toBe(400);
  });

  it("edits a project and logs a budget change only when the budget changes", async () => {
    const current: Project = {
      project_id: projectId,
      name: "Project",
      description: "",
      budget: 100,
      value: 0,
      goals: null,
      goals_met: null,
    };
    vi.mocked(getProjectByIdForUpdate).mockResolvedValue(current);
    vi.mocked(updateProject).mockImplementation(
      async (_db, _id, changes) => ({
        ...current,
        ...changes,
      }),
    );

    const described = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({ description: "New text", goals: null });
    expect(described.status).toBe(200);
    expect(updateProject).toHaveBeenCalledWith(expect.anything(), projectId, {
      description: "New text",
      goals: null,
    });
    expect(logAction).not.toHaveBeenCalled();

    const budgeted = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({ budget: 150 });
    expect(budgeted.status).toBe(200);
    expect(budgeted.body.project.budget).toBe(150);
    expect(logAction).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      "budget changed",
      {
        projectId,
      },
    );
  });

  it("rejects empty or unsupported project updates", async () => {
    const empty = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({});
    expect(empty.status).toBe(400);
    const valueEdit = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({ value: 5 });
    expect(valueEdit.status).toBe(400);
  });

  it("returns 404 when editing a missing project", async () => {
    vi.mocked(getProjectByIdForUpdate).mockResolvedValue(undefined);
    const response = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({ budget: 1 });
    expect(response.status).toBe(404);
    expect(updateProject).not.toHaveBeenCalled();
  });

  it("rejects creating a task before one of its predecessors", async () => {
    vi.mocked(getProjectBoardTasks).mockResolvedValue([
      { ...boardTask, position: 1 },
      { ...boardTask, task_id: userId, position: 2 },
    ]);
    const response = await request(app.callback())
      .post("/tasks/")
      .send({ ...taskBody, position: 2, predecessor_ids: [userId] });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "A task must appear after its predecessors",
    });
    expect(insertTask).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledOnce();
  });

  it("rejects assigning a later task as a predecessor", async () => {
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({ ...task, position: 2 });
    vi.mocked(getProjectBoardTasks).mockResolvedValue([
      { ...boardTask, task_id: userId, position: 3 },
      { ...boardTask, position: 2 },
    ]);
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send({ predecessor_ids: [userId] });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "A task must appear after its predecessors",
    });
    expect(updateTask).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { position: 2 },
    { project: projectId },
    { executed: true },
    { cost: -1 },
    { predecessor_ids: [userId, userId] },
  ])("rejects invalid task edits: %j", async (body) => {
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send(body);
    expect(response.status).toBe(400);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("prevents editing executed tasks", async () => {
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({
      ...task,
      executed: true,
    });
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send({ cost: 0 });
    expect(response.status).toBe(409);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it.each(["self", "cycle", "cross-project", "missing"])(
    "rejects %s dependencies when editing",
    async (reason) => {
      if (reason === "cycle")
        vi.mocked(getTaskAllPredecessors).mockResolvedValue([
          { task_id: taskId, executed: false },
        ]);
      if (reason === "cross-project")
        vi.mocked(getTaskProject).mockResolvedValue(userId);
      if (reason === "missing")
        vi.mocked(getTaskProject).mockResolvedValue(undefined);
      const response = await request(app.callback())
        .patch(`/tasks/${taskId}`)
        .send({ predecessor_ids: [reason === "self" ? taskId : userId] });
      expect(response.status).toBe(reason === "missing" ? 404 : 400);
      expect(updateTask).not.toHaveBeenCalled();
      expect(rollbackTransaction).toHaveBeenCalledOnce();
    },
  );

  it("reorders even executed tasks and returns the reordered board", async () => {
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({
      ...task,
      executed: true,
    });
    const reordered = [{ ...boardTask, position: 2 }];
    vi.mocked(getProjectBoardTasks)
      .mockResolvedValueOnce([boardTask, { ...boardTask, task_id: userId, position: 2 }])
      .mockResolvedValueOnce(reordered);
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}/position`)
      .send({ position: 2 });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Task moved successfully",
      tasks: reordered,
    });
    expect(updateTaskPosition).toHaveBeenCalledWith(
      expect.objectContaining({ isTransaction: true }),
      taskId,
      2,
    );
  });

  it("rejects a move that would place a dependent before its predecessor", async () => {
    vi.mocked(getProjectBoardTasks).mockResolvedValue([
      { ...boardTask, position: 1 },
      { ...boardTask, task_id: userId, position: 2 },
    ]);
    vi.mocked(getProjectTaskPredecessors).mockResolvedValue([
      { task_id: userId, predecessor_id: taskId },
    ]);
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}/position`)
      .send({ position: 2 });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "A task must appear after its predecessors",
    });
    expect(updateTaskPosition).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledOnce();
  });

  it.each([0, -1, 1.5, 2, "1"])(
    "rejects invalid or out-of-range moves: %s",
    async (position) => {
      const response = await request(app.callback())
        .patch(`/tasks/${taskId}/position`)
        .send({ position });
      expect(response.status).toBe(400);
      expect(updateTaskPosition).not.toHaveBeenCalled();
    },
  );

  it.each(["", "/position"])(
    "returns 404 for a missing task on PATCH %s",
    async (suffix) => {
      vi.mocked(getTaskById).mockResolvedValue(undefined);
      const response = await request(app.callback())
        .patch(`/tasks/${taskId}${suffix}`)
        .send(suffix ? { position: 1 } : { task_name: "Edited" });
      expect(response.status).toBe(404);
      expect(updateTask).not.toHaveBeenCalled();
      expect(updateTaskPosition).not.toHaveBeenCalled();
    },
  );

  it("requires authentication for edits and moves", async () => {
    const anonymousApp = new Koa();
    anonymousApp.use(tasksRouter.routes());
    for (const suffix of ["", "/position"]) {
      const response = await request(anonymousApp.callback())
        .patch(`/tasks/${taskId}${suffix}`)
        .send({ position: 1 });
      expect(response.status).toBe(401);
    }
    expect(updateTask).not.toHaveBeenCalled();
    expect(updateTaskPosition).not.toHaveBeenCalled();
  });

  it.each([
    `/tasks/${taskId}`,
    "/projects/by-name?name=Project",
    `/projects/${projectId}/completed`,
    `/projects/${projectId}/tasks?executed=false`,
  ])("requires authentication for GET %s", async (path) => {
    const anonymousApp = new Koa();
    anonymousApp.use(errorHandler);
    anonymousApp.use(tasksRouter.routes());
    anonymousApp.use(projectsRouter.routes());
    expect((await request(anonymousApp.callback()).get(path)).status).toBe(401);
  });

  it.each([
    "/tasks/not-a-uuid",
    "/projects/by-name",
    "/projects/by-name?name=%20",
    "/projects/not-a-uuid/completed",
    `/projects/${projectId}/tasks?executed=0`,
    `/projects/${projectId}/tasks?executed=yes`,
    `/projects/${projectId}/tasks?executed=`,
    `/projects/${projectId}/tasks?executed=true&executed=false`,
  ])("rejects malformed read requests: %s", async (path) => {
    expect((await request(app.callback()).get(path)).status).toBe(400);
    expect(getTaskById).not.toHaveBeenCalled();
    expect(getProjectById).not.toHaveBeenCalled();
    expect(getProjectBoardTasks).not.toHaveBeenCalled();
    expect(areAllProjectTasksExecuted).not.toHaveBeenCalled();
  });
});

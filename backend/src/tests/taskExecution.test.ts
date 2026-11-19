import { Pool } from "pg";
import { afterAll, beforeEach, describe, it, expect, vi } from "vitest";
import { createDatabase } from "../database/db.js";
import type { Task } from "../database/types.js";
import {
  areTaskPredecessorsExecuted as queryPredecessorExecution,
  getTaskAllPredecessors,
  getTaskById,
  getTaskProjectBudget,
  getTaskProject,
  getTasksByProjectIdAndStatus,
} from "../database/queries/tasks.js";
import {
  areTaskPredecessorsExecuted,
  canExecuteTask,
  isTaskWithinProjectBudget,
  isTaskProjectCompleted,
} from "../functions/taskExecutionRules.js";

vi.mock("../database/queries/tasks.js", () => ({
  areTaskPredecessorsExecuted: vi.fn(),
  getTaskAllPredecessors: vi.fn(),
  getTaskById: vi.fn(),
  getTaskProjectBudget: vi.fn(),
  getTaskProject: vi.fn(),
  getTasksByProjectIdAndStatus: vi.fn(),
}));

const database = createDatabase(new Pool());
afterAll(() => database.destroy());
const task: Task = {
  task_id: "task",
  task_name: "Task",
  description: "",
  project: "project",
  cost: 50,
  value: 10,
  steps: 1,
  position: 1,
  executed: false,
};

describe("task execution checks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getTaskProjectBudget).mockResolvedValue({ budget: 100 });
    vi.mocked(queryPredecessorExecution).mockResolvedValue(true);
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([]);
  });

  it.each([
    [100, true],
    [50, true],
    [49, false],
  ])("queries the owning project's budget and checks affordability (%s)", async (budget, expected) => {
    vi.mocked(getTaskProjectBudget).mockResolvedValue({ budget });
    const result = { executable: expected, reason: expected ? "" : "Not enough budget" };
    expect(await isTaskWithinProjectBudget(database, task)).toEqual(result);
    expect(await canExecuteTask(database, task)).toEqual(result);
    expect(getTaskProjectBudget).toHaveBeenCalledWith(database, task.task_id);
  });

  it("reports a missing owning project", async () => {
    vi.mocked(getTaskProjectBudget).mockResolvedValue(undefined);
    await expect(canExecuteTask(database, task)).rejects.toMatchObject({
      status: 404, message: "Project not found",
    });
  });

  it("queries predecessors itself and reports the unfinished task name", async () => {
    vi.mocked(queryPredecessorExecution).mockResolvedValue(false);
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([
      { task_id: "earlier", executed: false },
    ]);
    vi.mocked(getTaskById).mockResolvedValue({ ...task, task_id: "earlier", task_name: "Earlier task" });
    expect(await canExecuteTask(database, task)).toEqual({
      executable: false, reason: 'Complete "Earlier task" first',
    });
    expect(queryPredecessorExecution).toHaveBeenCalledWith(database, task.task_id);
    expect(getTaskById).toHaveBeenCalledWith(database, "earlier");
    expect(getTaskProjectBudget).not.toHaveBeenCalled();
  });

  it("preserves cycle rejection even if every returned ancestor is executed", async () => {
    vi.mocked(queryPredecessorExecution).mockResolvedValue(false);
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([
      { task_id: "ancestor", executed: true },
    ]);
    expect(await areTaskPredecessorsExecuted(database, task.task_id)).toEqual({
      executable: false,
      reason: "Task predecessors must exist and be executed without cycles",
    });
  });

  it("blocks an already-executed task without querying its eligibility", async () => {
    expect(await canExecuteTask(database, { ...task, executed: true })).toEqual({
      executable: false, reason: "Task was already executed",
    });
    expect(queryPredecessorExecution).not.toHaveBeenCalled();
    expect(getTaskProjectBudget).not.toHaveBeenCalled();
  });

  it("propagates database failures rather than treating them as ineligibility", async () => {
    const error = new Error("Database unavailable");
    vi.mocked(queryPredecessorExecution).mockRejectedValue(error);
    await expect(canExecuteTask(database, task)).rejects.toBe(error);
  });

  it.each([true, false])("checks project completion with pending tasks=%s", async (hasPendingTasks) => {
    vi.mocked(getTaskProject).mockResolvedValue(task.project);
    vi.mocked(getTasksByProjectIdAndStatus).mockResolvedValue(hasPendingTasks ? [task] : []);
    expect(await isTaskProjectCompleted(database, task.task_id)).toBe(!hasPendingTasks);
    expect(getTaskProject).toHaveBeenCalledWith(database, task.task_id);
    expect(getTasksByProjectIdAndStatus).toHaveBeenCalledWith(database, task.project, false);
  });

  it("does not report completion when the supplied task does not exist", async () => {
    vi.mocked(getTaskProject).mockResolvedValue(undefined);
    await expect(isTaskProjectCompleted(database, "missing")).rejects.toMatchObject({
      status: 404, message: "Task not found",
    });
    expect(getTasksByProjectIdAndStatus).not.toHaveBeenCalled();
  });

  it("propagates failed completion queries instead of reporting a completed project", async () => {
    const error = new Error("Database unavailable");
    vi.mocked(getTaskProject).mockResolvedValue(task.project);
    vi.mocked(getTasksByProjectIdAndStatus).mockRejectedValue(error);
    await expect(isTaskProjectCompleted(database, task.task_id)).rejects.toBe(error);
  });
});

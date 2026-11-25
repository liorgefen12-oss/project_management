import { Pool } from "pg";
import { afterAll, beforeEach, describe, it, expect, vi } from "vitest";
import { createDatabase } from "../database/db.js";
import type { Task } from "../database/types.js";
import {
  areTaskPredecessorsExecuted as queryPredecessorExecution,
  getTaskAllPredecessors,
  getTaskById,
  getTaskProjectBudget,
} from "../database/queries/tasks.js";
import {
  canExecuteTask,
  isTaskWithinProjectBudget,
} from "../functions/taskExecutionRules.js";

vi.mock("../database/queries/tasks.js", () => ({
  areTaskPredecessorsExecuted: vi.fn(),
  getTaskAllPredecessors: vi.fn(),
  getTaskById: vi.fn(),
  getTaskProjectBudget: vi.fn(),
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
    vi.mocked(getTaskProjectBudget).mockResolvedValue({ budget: 100 }); //mock the project budget to be 100
    vi.mocked(queryPredecessorExecution).mockResolvedValue(true); //mock the task's predecessors as executed
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([]);
  });

  it.each([
    [100, true],
    [50, true],
    [49, false],
  ])(
    "checks project budget and task affordability",
    async (budget, expected) => {
      vi.mocked(getTaskProjectBudget).mockResolvedValue({ budget });
      const result = {
        executable: expected,
        reason: expected ? "" : "Not enough budget",
      };
      expect(await isTaskWithinProjectBudget(database, task)).toEqual(result);
      expect(await canExecuteTask(database, task)).toEqual(result);
      expect(getTaskProjectBudget).toHaveBeenCalledWith(database, task.task_id);
    },
  );

  it("reports a missing project", async () => {
    vi.mocked(getTaskProjectBudget).mockResolvedValue(undefined);
    await expect(canExecuteTask(database, task)).rejects.toMatchObject({
      status: 404,
      message: "Project not found",
    });
  });

  it("goes through predecessors and reports unexecuted predecessors", async () => {
    vi.mocked(queryPredecessorExecution).mockResolvedValue(false); //pretend all predecessors arent executed
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([
      { task_id: "earlier", executed: false },
    ]);
    vi.mocked(getTaskById).mockResolvedValue({
      ...task,
      task_id: "earlier",
      task_name: "Earlier task",
    });
    expect(await canExecuteTask(database, task)).toEqual({
      executable: false,
      reason: 'Complete "Earlier task" first',
    });
    expect(queryPredecessorExecution).toHaveBeenCalledWith(
      database,
      task.task_id,
    );
    expect(getTaskById).toHaveBeenCalledWith(database, "earlier");
    expect(getTaskProjectBudget).not.toHaveBeenCalled();
  });

  it("blocks execution of an already-executed task", async () => {
    expect(await canExecuteTask(database, { ...task, executed: true })).toEqual(
      {
        executable: false,
        reason: "Task was already executed",
      },
    );
    expect(queryPredecessorExecution).not.toHaveBeenCalled();
    expect(getTaskProjectBudget).not.toHaveBeenCalled();
  });
});

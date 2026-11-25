import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../database/queries/audit_logs.js");
vi.mock("../../database/queries/projects.js");
vi.mock("../../database/queries/tasks.js");

import {
  app,
  areAllProjectTasksExecuted,
  areTaskPredecessorsExecuted,
  getTaskAllPredecessors,
  getTaskByIdForUpdate,
  getTaskProjectBudget,
  logAction,
  markExecuted,
  projectId,
  resetControllerMocks,
  refreshProjectGoalsMet,
  task,
  taskId,
  userId,
} from "./controllerUtilities.js";

describe("executing a task", () => {
  beforeEach(resetControllerMocks);

  it("executes a task and logs project completion when all tasks are done", async () => {
    vi.mocked(areAllProjectTasksExecuted).mockResolvedValue(true);

    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );

    expect(response.status).toBe(200);
    expect(markExecuted).toHaveBeenCalledWith(expect.anything(), taskId);
    expect(refreshProjectGoalsMet).toHaveBeenCalledWith(expect.anything(), projectId);
    expect(logAction).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      "project completed",
      { projectId },
    );
  });

  it("does not execute a task when a predecessor is unfinished", async () => {
    vi.mocked(areTaskPredecessorsExecuted).mockResolvedValue(false);
    vi.mocked(getTaskAllPredecessors).mockResolvedValue([
      { task_id: userId, executed: false },
    ]);

    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Complete "Test task" first');
    expect(markExecuted).not.toHaveBeenCalled();
  });

  it("does not execute a task when the budget is too low", async () => {
    vi.mocked(getTaskProjectBudget).mockResolvedValue({ budget: 9 });

    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Not enough budget");
    expect(markExecuted).not.toHaveBeenCalled();
  });

  it("does not execute the same task twice", async () => {
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({
      ...task,
      executed: true,
    });

    const response = await request(app.callback()).post(
      `/tasks/${taskId}/execute`,
    );

    expect(response.status).toBe(409);
    expect(markExecuted).not.toHaveBeenCalled();
  });
});

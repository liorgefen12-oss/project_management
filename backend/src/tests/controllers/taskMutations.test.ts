import Koa from "koa";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

//import all functions from those directories as vi.fn()
vi.mock("../../database/queries/audit_logs.js");
vi.mock("../../database/queries/projects.js");
vi.mock("../../database/queries/tasks.js");

import {
  app,
  getTaskByIdForUpdate,
  insertTask,
  projectId,
  resetControllerMocks,
  task,
  taskId,
  tasksRouter,
  updateTask,
} from "./controllerUtilities.js";

describe("creating and editing tasks", () => {
  beforeEach(resetControllerMocks);

  it("creates a task", async () => {
    vi.mocked(insertTask).mockResolvedValue(task);

    const response = await request(app.callback()).post("/tasks/").send({
      task_name: "New task",
      description: "",
      cost: 1,
      value: 1,
      steps: 1,
      position: 2,
      project: projectId,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(task);
    expect(insertTask).toHaveBeenCalledOnce();
  });

  it("edits a task", async () => {
    const editedTask = { ...task, task_name: "Edited task" };
    vi.mocked(updateTask).mockResolvedValue(editedTask);

    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send({ task_name: "Edited task" });

    expect(response.status).toBe(200);
    expect(response.body.task).toEqual(editedTask);
  });

  it("does not edit an executed task", async () => {
    vi.mocked(getTaskByIdForUpdate).mockResolvedValue({
      ...task,
      executed: true,
    });

    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send({ task_name: "Edited task" });

    expect(response.status).toBe(409);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("rejects a task that depends on itself", async () => {
    const response = await request(app.callback())
      .patch(`/tasks/${taskId}`)
      .send({ predecessor_ids: [taskId] });

    expect(response.status).toBe(400);
    expect(updateTask).not.toHaveBeenCalled();
  });
});

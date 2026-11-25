import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

//mocks for functions and objects
vi.mock("../../database/queries/audit_logs.js", () => ({ logAction: vi.fn() }));
vi.mock("../../database/queries/projects.js");
vi.mock("../../database/queries/tasks.js");

import {
  app,
  getProjectByIdForUpdate,
  insertProject,
  logAction,
  projectId,
  resetControllerMocks,
  updateProject,
  userId,
} from "./controllerUtilities.js";

describe("controller behavior", () => {
  beforeEach(resetControllerMocks);

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

  it("edits a project and logs a budget change", async () => {
    const current = {
      project_id: projectId,
      name: "Project",
      description: "",
      budget: 100,
      value: 0,
      goals: null,
      goals_met: null,
    };
    vi.mocked(getProjectByIdForUpdate).mockResolvedValue(current);
    vi.mocked(updateProject).mockResolvedValue({ ...current, budget: 150 });

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
      .send({ value: 5 }); //a user cant update project's value - its calculated from the tasks' values
    expect(valueEdit.status).toBe(400);
  });

  it.each([
    [null, { cost: 50, steps: 5 }],
    [{ cost: 50, steps: 5 }, { cost: 60, steps: 5 }],
    [{ cost: 50, steps: 5 }, null],
  ])("logs goals changing from %j to %j", async (before, after) => {
    const current = {
      project_id: projectId,
      name: "Project",
      description: "",
      budget: 100,
      value: 0,
      goals: before,
      goals_met: null,
    };
    vi.mocked(getProjectByIdForUpdate).mockResolvedValue(current);
    vi.mocked(updateProject).mockResolvedValue({ ...current, goals: after });

    const response = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({ goals: after });

    expect(response.status).toBe(200);
    expect(logAction).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      "goals changed",
      { projectId },
    );
  });

  it("does not log unchanged goals", async () => {
    const current = {
      project_id: projectId,
      name: "Project",
      description: "",
      budget: 100,
      value: 0,
      goals: { cost: 50, steps: 5 },
      goals_met: null,
    };
    vi.mocked(getProjectByIdForUpdate).mockResolvedValue(current);
    vi.mocked(updateProject).mockResolvedValue(current);

    const response = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({ goals: current.goals });

    expect(response.status).toBe(200);
    expect(logAction).not.toHaveBeenCalled();
  });

  it("returns 404 when editing a missing project", async () => {
    vi.mocked(getProjectByIdForUpdate).mockResolvedValue(undefined);
    //project is undefined - missing
    const response = await request(app.callback())
      .patch(`/projects/${projectId}`)
      .send({ budget: 1 });
    //a request is sent about a missing project, invalid
    expect(response.status).toBe(404);
    expect(updateProject).not.toHaveBeenCalled();
  });
});

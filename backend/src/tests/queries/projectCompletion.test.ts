import { describe, expect, it } from "vitest";
import {
  areAllProjectTasksExecuted,
  getProjectById,
  refreshProjectGoalsMet,
  updateProject,
} from "../../database/queries/projects.js";
import { insertTask } from "../../database/queries/tasks.js";
import { projectId, projectId_empty, useQueryDatabase } from "./testDatabase.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("project completion", () => {
  const getDatabase = useQueryDatabase();

  it("completes a project only when it has tasks and they are all executed", async () => {
    const database = getDatabase();

    expect(await areAllProjectTasksExecuted(database, projectId_empty)).toBe(false);
    expect(await areAllProjectTasksExecuted(database, projectId)).toBe(false);

    await database
      .updateTable("public.tasks")
      .set({ executed: true })
      .where("project", "=", projectId)
      .execute();

    expect(await areAllProjectTasksExecuted(database, projectId)).toBe(true);
  });

  it.each([
    [{ cost: 31, steps: 7 }, true],
    [{ cost: 30, steps: 7 }, false],
    [{ cost: 29, steps: 7 }, false],
    [{ cost: 31, steps: 6 }, false],
    [{ cost: 31, steps: 5 }, false],
    [null, null],
  ])("evaluates completed project goals %j as %j", async (goals, expected) => {
    const database = getDatabase();
    await database.updateTable("public.tasks")
      .set({ executed: true, cost: 10, steps: 2 })
      .where("project", "=", projectId)
      .execute();

    const project = await updateProject(database, projectId, { goals });
    expect(project.goals_met).toBe(expected);
    expect((await getProjectById(database, projectId))?.goals_met).toBe(expected);
  });

  it("keeps incomplete and empty projects unevaluated", async () => {
    const database = getDatabase();
    for (const id of [projectId, projectId_empty]) {
      const project = await updateProject(database, id, {
        goals: { cost: 10_000_000_000, steps: 10 },
      });
      expect(project.goals_met).toBeNull();
    }
  });

  it("recalculates after goal edits, clearing goals and reopening a project", async () => {
    const database = getDatabase();
    await database.updateTable("public.tasks")
      .set({ executed: true, cost: 10, steps: 2 })
      .where("project", "=", projectId)
      .execute();
    expect((await updateProject(database, projectId, {
      goals: { cost: 31, steps: 7 },
    })).goals_met).toBe(true);
    expect((await updateProject(database, projectId, {
      goals: { cost: 30, steps: 7 },
    })).goals_met).toBe(false);
    expect((await updateProject(database, projectId, { goals: null })).goals_met).toBeNull();
    await updateProject(database, projectId, { goals: { cost: 31, steps: 7 } });

    const reopened = await database.transaction().execute(async (trx) => {
      await insertTask(trx, {
        task_name: "Another task",
        description: "",
        project: projectId,
        position: 4,
        cost: 0,
        value: 0,
        steps: 1,
      });
      return refreshProjectGoalsMet(trx, projectId);
    });
    expect(reopened.goals_met).toBeNull();
  });

});

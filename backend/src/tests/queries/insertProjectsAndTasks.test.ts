import { describe, expect, it } from "vitest";
import {
  getTaskProject,
  getTaskDirectPredecessors,
  insertTask,
} from "../../database/queries/tasks.js";
import {
  insertProject,
} from "../../database/queries/projects.js";
import { useQueryDatabase, projectId, secondId, thirdId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: insertProjectsAndTasks", () => {
  const getDatabase = useQueryDatabase();
  it("inserts projects and tasks with generated ids and surfaces unique violations", async () => {
    const database = getDatabase();
    const project = await insertProject(database, {
      name: "New project",
      description: "desc",
      budget: 50,
      value: 5,
    });
    expect(project.project_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(project).toMatchObject({ name: "New project", budget: 50 });
    const defaultValueProject = await insertProject(database, {
      name: "Default value project",
      description: "",
      budget: 10,
    });
    expect(defaultValueProject.value).toBe(0);
    await expect(
      insertProject(database, {
        name: "New project",
        description: "",
        budget: 1,
        value: 1,
      }),
    ).rejects.toMatchObject({ code: "23505" });
  
    const newTask = {
      task_name: "New task",
      description: "",
      cost: 1,
      value: 1,
      steps: 1,
      position: 4,
      project: projectId,
    };
    const task = await insertTask(database, newTask, [secondId, thirdId]);
    expect(task.task_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(task).toMatchObject({
      executed: false,
    });
    expect(
      (await getTaskDirectPredecessors(database, task.task_id)).map((row) => row.task_id),
    ).toEqual([secondId, thirdId]);
    expect(await getTaskProject(database, task.task_id)).toBe(projectId);
    await expect(insertTask(database, newTask)).rejects.toMatchObject({
      code: "23505",
    });
  });
});

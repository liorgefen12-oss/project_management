import { describe, expect, it } from "vitest";
import { areAllProjectTasksExecuted } from "../../database/queries/projects.js";
import { projectId, projectId_empty, useQueryDatabase } from "./fakeDB.js";

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
});

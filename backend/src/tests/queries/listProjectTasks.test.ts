import { describe, expect, it } from "vitest";
import {
  getTasksByProjectId,
  getTasksByProjectName,
} from "../../database/queries/tasks.js";
import { useQueryDatabase, projectId, firstId, secondId, thirdId, missingId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: listProjectTasks", () => {
  const getDatabase = useQueryDatabase();
  it("lists only the requested project in position order, by id and by name", async () => {
    const database = getDatabase();
    for (const tasks of [
      await getTasksByProjectId(database, projectId),
      await getTasksByProjectName(database, "Main project"),
    ]) {
      expect(tasks.map((task) => task.task_id)).toEqual([
        firstId,
        secondId,
        thirdId,
      ]);
      expect(tasks[0].executed).toBe(false);
    }
    expect(await getTasksByProjectId(database, missingId)).toEqual([]);
    expect(await getTasksByProjectName(database, "' OR true --")).toEqual([]);
  });
});

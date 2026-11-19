import { describe, expect, it } from "vitest";
import {
  getTasksByProjectId,
  insertTask,
} from "../../database/queries/tasks.js";
import { useQueryDatabase, projectId, firstId, secondId, thirdId, missingId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: insertTaskRollback", () => {
  const getDatabase = useQueryDatabase();
  it("rolls back task creation if a predecessor link is invalid", async () => {
    const database = getDatabase();
    await expect(insertTask(database, {
      task_name: "Invalid dependency", description: "", cost: 1, value: 1,
      steps: 1, position: 4, project: projectId,
    }, [firstId, missingId])).rejects.toMatchObject({ code: "23503" });
    expect((await getTasksByProjectId(database, projectId)).map((row) => row.task_id))
      .toEqual([firstId, secondId, thirdId]);
  });
});

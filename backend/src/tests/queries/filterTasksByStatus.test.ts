import { describe, expect, it } from "vitest";
import {
  getTasksByProjectIdAndStatus,
  getTasksByProjectNameAndStatus,
} from "../../database/queries/tasks.js";
import { useQueryDatabase, projectId, firstId, secondId, thirdId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: filterTasksByStatus", () => {
  const getDatabase = useQueryDatabase();
  it.each([true, false])(
    "filters executed=%s without dropping false",
    async (completed) => {
    const database = getDatabase();
      const expected = completed ? [secondId] : [firstId, thirdId];
      expect(
        (
          await getTasksByProjectIdAndStatus(database, projectId, completed)
        ).map((task) => task.task_id),
      ).toEqual(expected);
      expect(
        (
          await getTasksByProjectNameAndStatus(database, 
            "Main project",
            completed,
          )
        ).map((task) => task.task_id),
      ).toEqual(expected);
    },
  );
});

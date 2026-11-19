import { describe, expect, it } from "vitest";
import {
  getTasksByProjectId,
  updateTaskPosition,
} from "../../database/queries/tasks.js";
import { useQueryDatabase, projectId, firstId, secondId, thirdId, missingId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: invalidTaskPositions", () => {
  const getDatabase = useQueryDatabase();
  it("surfaces invalid moves without changing task order", async () => {
    const database = getDatabase();
    await expect(updateTaskPosition(database, missingId, 1)).rejects.toThrow(
      "does not exist",
    );
    await expect(updateTaskPosition(database, firstId, 0)).rejects.toThrow(
      "out of range",
    );
    await expect(updateTaskPosition(database, firstId, 4)).rejects.toThrow(
      "out of range",
    );
    await expect(updateTaskPosition(database, firstId, 1.5)).rejects.toThrow(
      "integer",
    );
    expect(
      (await getTasksByProjectId(database, projectId)).map(
        (task) => task.task_id,
      ),
    ).toEqual([firstId, secondId, thirdId]);
  });
});

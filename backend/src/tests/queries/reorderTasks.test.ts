import { describe, expect, it } from "vitest";
import {
  getTasksByProjectId,
  updateTaskPosition,
} from "../../database/queries/tasks.js";
import { useQueryDatabase, projectId, otherProjectId, firstId, secondId, thirdId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: reorderTasks", () => {
  const getDatabase = useQueryDatabase();
  it("reorders in both directions, keeps other projects unchanged, and allows no-op moves", async () => {
    const database = getDatabase();
    await updateTaskPosition(database, thirdId, 1);
    expect(
      (await getTasksByProjectId(database, projectId)).map((task) => [
        task.task_id,
        task.position,
      ]),
    ).toEqual([
      [thirdId, 1],
      [firstId, 2],
      [secondId, 3],
    ]);
    await updateTaskPosition(database, thirdId, 3);
    await updateTaskPosition(database, thirdId, 3);
    expect(
      (await getTasksByProjectId(database, projectId)).map(
        (task) => task.task_id,
      ),
    ).toEqual([firstId, secondId, thirdId]);
    expect(
      (await getTasksByProjectId(database, otherProjectId))[0].position,
    ).toBe(1);
  });
});

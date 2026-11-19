import { describe, expect, it } from "vitest";
import {
  getTaskAllPredecessors,
  getTaskDirectPredecessors,
  areTaskPredecessorsExecuted,
  getTaskById,
  getProjectBoardTasks,
} from "../../database/queries/tasks.js";
import { sql } from "kysely";
import { useQueryDatabase, projectId, firstId, secondId, thirdId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: multiplePredecessors", () => {
  const getDatabase = useQueryDatabase();
  it("returns multiple predecessors once, including a shared ancestor", async () => {
    const database = getDatabase();
    await database.insertInto("public.task_predecessors")
      .values({ task_id: thirdId, predecessor_id: firstId }).execute();
    const predecessors = await getTaskAllPredecessors(database, thirdId);
    expect(predecessors).toEqual([
      { task_id: firstId, executed: false },
      { task_id: secondId, executed: true },
    ]);
    expect(await areTaskPredecessorsExecuted(database, thirdId)).toBe(false);
    await database.updateTable("public.tasks").set({ executed: true })
      .where("task_id", "=", firstId).execute();
    expect(await areTaskPredecessorsExecuted(database, thirdId)).toBe(true);
    await database.updateTable("public.tasks").set({ executed: false })
      .where("task_id", "=", secondId).execute();
    expect(await areTaskPredecessorsExecuted(database, thirdId)).toBe(false);
    const stored = await sql<{ task_id: string }>`
      select * from public.get_task_predecessors(${thirdId}::uuid)
    `.execute(database);
    expect(stored.rows.map((row) => row.task_id)).toEqual([firstId, secondId]);
    expect((await getTaskDirectPredecessors(database, thirdId)).map((row) => row.task_id))
      .toEqual([firstId, secondId]);
    expect(await getTaskById(database, thirdId)).not.toHaveProperty("predecessor_ids");
    expect((await getProjectBoardTasks(database, projectId))[2])
      .not.toHaveProperty("predecessor_ids");
  });
});

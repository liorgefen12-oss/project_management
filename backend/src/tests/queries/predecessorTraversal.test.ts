import { describe, expect, it } from "vitest";
import {
  getTaskAllPredecessors,
  getTaskDirectPredecessors,
  areTaskPredecessorsExecuted,
} from "../../database/queries/tasks.js";
import { useQueryDatabase, firstId, secondId, thirdId, missingId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: predecessorTraversal", () => {
  const getDatabase = useQueryDatabase();
  it("returns only predecessor IDs and execution states, recursively and nearest-first", async () => {
    const database = getDatabase();
    expect(await getTaskAllPredecessors(database, thirdId)).toEqual([
      { task_id: secondId, executed: true },
      { task_id: firstId, executed: false },
    ]);
    expect(await getTaskDirectPredecessors(database, thirdId)).toEqual([
      { task_id: secondId, executed: true },
    ]);
    expect(await getTaskAllPredecessors(database, firstId)).toEqual([]);
    expect(await getTaskAllPredecessors(database, missingId)).toEqual([]);
    expect(await areTaskPredecessorsExecuted(database, firstId)).toBe(true);
    expect(await areTaskPredecessorsExecuted(database, thirdId)).toBe(false);
  });

  it("terminates on cycles and rejects them even if every task is executed", async () => {
    const database = getDatabase();
    await database
      .insertInto("public.task_predecessors")
      .values({ task_id: firstId, predecessor_id: thirdId })
      .execute();
    expect(
      (await getTaskAllPredecessors(database, thirdId)).map(
        (task) => task.task_id,
      ),
    ).toEqual([secondId, firstId]);
    await database.updateTable("public.tasks").set({ executed: true }).execute();
    expect(await areTaskPredecessorsExecuted(database, thirdId)).toBe(false);
  });

  it("rejects a cycle among ancestors that does not contain the requested task", async () => {
    const database = getDatabase();
    await database.insertInto("public.task_predecessors")
      .values({ task_id: firstId, predecessor_id: secondId }).execute();
    await database.updateTable("public.tasks").set({ executed: true })
      .where("task_id", "in", [firstId, secondId]).execute();
    expect(await getTaskAllPredecessors(database, thirdId)).toEqual([
      { task_id: secondId, executed: true },
      { task_id: firstId, executed: true },
    ]);
    expect(await areTaskPredecessorsExecuted(database, thirdId)).toBe(false);
  });
});

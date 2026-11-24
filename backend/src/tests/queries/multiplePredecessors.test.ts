import { describe, expect, it } from "vitest";
import {
  getTaskAllPredecessors,
  areTaskPredecessorsExecuted,
  getTaskById,
  getProjectBoardTasks,
} from "../../database/queries/tasks.js";
import {
  getDirectPredecessors,
  useQueryDatabase,
  projectId,
  taskId_1,
  taskId_2,
  taskId_3,
} from "./fakeDB.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "PostgreSQL queries: multiplePredecessors",
  () => {
    const getDatabase = useQueryDatabase();
    it("returns multiple predecessors once, including a shared ancestor", async () => {
      const database = getDatabase();
      await database
        .insertInto("public.task_predecessors")
        .values({ task_id: taskId_3, predecessor_id: taskId_1 })
        .execute();
      const predecessors = await getTaskAllPredecessors(database, taskId_3);
      expect(predecessors).toEqual([
        { task_id: taskId_1, executed: false },
        { task_id: taskId_2, executed: true },
      ]);
      expect(await areTaskPredecessorsExecuted(database, taskId_3)).toBe(false);
      await database
        .updateTable("public.tasks")
        .set({ executed: true })
        .where("task_id", "=", taskId_1)
        .execute();
      expect(await areTaskPredecessorsExecuted(database, taskId_3)).toBe(true);
      await database
        .updateTable("public.tasks")
        .set({ executed: false })
        .where("task_id", "=", taskId_2)
        .execute();
      expect(await areTaskPredecessorsExecuted(database, taskId_3)).toBe(false);

      expect(
        (await getDirectPredecessors(database, taskId_3)).map(
          (row) => row.task_id,
        ),
      ).toEqual([taskId_1, taskId_2]);
      expect(await getTaskById(database, taskId_3)).not.toHaveProperty(
        "predecessor_ids",
      );
      expect(
        (await getProjectBoardTasks(database, projectId))[2],
      ).not.toHaveProperty("predecessor_ids");
    });
  },
);

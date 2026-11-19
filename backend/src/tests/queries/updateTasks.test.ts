import { bodyParser } from "@koa/bodyparser";
import Koa from "koa";
import session from "koa-session";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  getTaskById,
  getTaskDirectPredecessors,
  getTasksByProjectId,
  updateTask,
} from "../../database/queries/tasks.js";
import { errorHandler } from "../../middlewares/errorHandler.js";
import { tasksRouter } from "../../routers/tasks.js";
import {
  firstId,
  missingId,
  projectId,
  secondId,
  thirdId,
  useQueryDatabase,
} from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL task updates", () => {
  const getDatabase = useQueryDatabase();

  function client() {
    const app = new Koa();
    app.context.database = getDatabase();
    app.use(errorHandler);
    app.use(bodyParser());
    app.use(session({ signed: false }, app));
    app.use(async (ctx, next) => {
      ctx.session!.userId = firstId;
      await next();
    });
    app.use(tasksRouter.routes());
    return request(app.callback());
  }

  it("preserves omitted fields and dependencies, replaces links, and clears them with []", async () => {
    const db = getDatabase();
    const original = await getTaskById(db, thirdId);
    const edited = await updateTask(db, thirdId, { task_name: "Renamed" });
    expect(edited).toEqual({ ...original, task_name: "Renamed" });
    expect(await getTaskDirectPredecessors(db, thirdId)).toEqual([
      { task_id: secondId, executed: true },
    ]);
    await updateTask(db, thirdId, {}, [firstId]);
    expect(await getTaskDirectPredecessors(db, thirdId)).toEqual([
      { task_id: firstId, executed: false },
    ]);
    const cleared = await updateTask(db, thirdId, {}, []);
    expect(await getTaskDirectPredecessors(db, thirdId)).toEqual([]);
    expect(cleared.task_name).toBe("Renamed");
  });

  it("rolls back both field changes and replaced dependencies on a failed update", async () => {
    const db = getDatabase();
    const original = await getTaskById(db, thirdId);
    await expect(updateTask(db, thirdId, { cost: 0 }, [firstId, missingId]))
      .rejects.toMatchObject({ code: "23503" });
    expect(await getTaskById(db, thirdId)).toEqual(original);
    expect(await getTaskDirectPredecessors(db, thirdId)).toEqual([
      { task_id: secondId, executed: true },
    ]);
  });

  it("serializes concurrent dependency edits so only one side of a cycle can commit", async () => {
    const db = getDatabase();
    await db.deleteFrom("public.task_predecessors").execute();
    const responses = await Promise.all([
      client().patch(`/tasks/${firstId}`).send({ predecessor_ids: [thirdId] }),
      client().patch(`/tasks/${thirdId}`).send({ predecessor_ids: [firstId] }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
    expect(await db.selectFrom("public.task_predecessors").selectAll().execute())
      .toHaveLength(1);
  });

  it("persists endpoint edits and reorders the board without altering task execution", async () => {
    const edited = await client().patch(`/tasks/${thirdId}`)
      .send({ cost: 4, value: 7, steps: 2, predecessor_ids: [firstId] });
    expect(edited.status).toBe(200);
    expect(await getTaskById(getDatabase(), thirdId)).toMatchObject({
      cost: 4, value: 7, steps: 2,
    });
    expect(await getTaskDirectPredecessors(getDatabase(), thirdId)).toEqual([
      { task_id: firstId, executed: false },
    ]);
    const moved = await client().patch(`/tasks/${secondId}/position`)
      .send({ position: 3 });
    expect(moved.status).toBe(200);
    expect(moved.body.tasks.map((task: { task_id: string; position: number }) =>
      [task.task_id, task.position],
    )).toEqual([[firstId, 1], [thirdId, 2], [secondId, 3]]);
    expect((await getTasksByProjectId(getDatabase(), projectId))
      .find((task) => task.task_id === secondId)?.executed).toBe(true);
  });

  it("rejects moves that place a task before a predecessor or a dependent before it", async () => {
    const before = await getTasksByProjectId(getDatabase(), projectId);
    const beforePositions = before.map(({ task_id, position }) => [
      task_id,
      position,
    ]);

    const dependentBeforePredecessor = await client()
      .patch(`/tasks/${secondId}/position`)
      .send({ position: 1 });
    expect(dependentBeforePredecessor.status).toBe(400);

    const predecessorAfterDependent = await client()
      .patch(`/tasks/${firstId}/position`)
      .send({ position: 3 });
    expect(predecessorAfterDependent.status).toBe(400);

    expect(
      (await getTasksByProjectId(getDatabase(), projectId)).map(
        ({ task_id, position }) => [task_id, position],
      ),
    ).toEqual(beforePositions);
  });
});

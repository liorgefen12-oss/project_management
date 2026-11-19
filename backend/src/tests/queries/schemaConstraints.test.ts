import { describe, expect, it } from "vitest";
import { useQueryDatabase, firstId, missingId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: schemaConstraints", () => {
  const getDatabase = useQueryDatabase();
  it("preserves the email domain, audit identity, foreign keys, and task constraints", async () => {
    const database = getDatabase();
    await expect(
      database
        .insertInto("public.users")
        .values({
          first_name: "Test",
          last_name: "User",
          password: "test-only",
          email: "test@example.com",
        })
        .execute(),
    ).rejects.toThrow("outlook_email_format");
    const user = await database
      .insertInto("public.users")
      .values({
        first_name: "Test",
        last_name: "User",
        password: "test-only",
        email: "test@outlook.com",
      })
      .returning("user_id")
      .executeTakeFirstOrThrow();
    const action = await database
      .insertInto("audit.task_actions")
      .values({ action_name: "test" })
      .returning("action_id")
      .executeTakeFirstOrThrow();
    const log = await database
      .insertInto("audit.logs")
      .values({ user_id: user.user_id, action_id: action.action_id })
      .returningAll()
      .executeTakeFirstOrThrow();
    expect(log.created_at).toBeInstanceOf(Date);
    expect(log.project_id).toBeNull();
    expect(action.action_id).toBe(1);
    await expect(
      database
        .insertInto("public.task_predecessors")
        .values({ task_id: firstId, predecessor_id: firstId })
        .execute(),
    ).rejects.toThrow("task_predecessors_check");
    await expect(
      database
        .updateTable("public.tasks")
        .set({ position: 0 })
        .where("task_id", "=", firstId)
        .execute(),
    ).rejects.toThrow("tasks_position_positive");
    await expect(
      database
        .updateTable("public.tasks")
        .set({ project: missingId })
        .where("task_id", "=", firstId)
        .execute(),
    ).rejects.toThrow("tasks_project_fkey");
    await expect(
      database
        .updateTable("public.tasks")
        .set({ position: 2 })
        .where("task_id", "=", firstId)
        .execute(),
    ).rejects.toThrow("tasks_project_position_uq");
  });
});

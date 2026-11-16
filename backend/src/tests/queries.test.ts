import { readFile } from "node:fs/promises";
import { sql, type Kysely } from "kysely";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createProjectQueries } from "../database/queries.js";
import type { Database } from "../database/types.js";
import { createDatabase } from "../database/db.js";

const connectionString = process.env.TEST_DATABASE_URL;
const projectId = "00000000-0000-4000-8000-000000000001";
const emptyProjectId = "00000000-0000-4000-8000-000000000002";
const otherProjectId = "00000000-0000-4000-8000-000000000003";
const firstId = "00000000-0000-4000-8000-000000000011";
const secondId = "00000000-0000-4000-8000-000000000012";
const thirdId = "00000000-0000-4000-8000-000000000013";
const otherId = "00000000-0000-4000-8000-000000000014";
const missingId = "00000000-0000-4000-8000-000000000099";

describe.skipIf(!connectionString)(
  "PostgreSQL schema and project queries",
  () => {
    let database: Kysely<Database>;
    let queries: ReturnType<typeof createProjectQueries>;
    let schemaCreated = false;

    beforeAll(async () => {
      if (
        !connectionString ||
        new URL(connectionString).pathname !== "/fullstack_kysely_test"
      ) {
        throw new Error(
          "Tests require an empty disposable database named fullstack_kysely_test.",
        );
      }
      database = createDatabase(
        new Pool({ connectionString, connectionTimeoutMillis: 5000 }),
      );
      queries = createProjectQueries(database);
      const { rows } = await sql<{ count: string }>`
      select count(*)::text as count from information_schema.tables
      where table_schema in ('public', 'audit')
    `.execute(database);
      if (rows[0].count !== "0") {
        throw new Error(
          "Refusing to run integration tests against a nonempty database.",
        );
      }
      const schema = await readFile(
        new URL("./test-schema.sql", import.meta.url),
        "utf8",
      );
      await database.transaction().execute(async (transaction) => {
        await sql.raw(schema).execute(transaction);
      });
      schemaCreated = true;
    });

    afterAll(async () => {
      if (!database) return;
      try {
        if (schemaCreated) {
          await database.transaction().execute(async (transaction) => {
            await sql`
            DROP FUNCTION public.update_task_position(uuid, integer);
            DROP FUNCTION public.get_task_predecessors(uuid);
            DROP FUNCTION public.get_tasks_by_project_id(uuid);
            DROP FUNCTION public.get_tasks_by_project_id_and_status(uuid, boolean);
            DROP FUNCTION public.get_tasks_by_project_name(varchar);
            DROP FUNCTION public.get_tasks_by_project_name_and_status(varchar, boolean);
            DROP FUNCTION public.get_project_total_cost_by_id(uuid);
            DROP FUNCTION public.get_project_total_cost_by_name(varchar);
            DROP FUNCTION public.get_project_total_value_by_id(uuid);
            DROP FUNCTION public.get_project_total_value_by_name(varchar);
            DROP TABLE audit.logs;
            DROP TABLE audit.task_actions;
            DROP TABLE public.tasks;
            DROP TABLE public.projects;
            DROP TABLE public.users;
            DROP DOMAIN public.outlook_email;
            DROP SCHEMA audit;
          `.execute(transaction);
          });
          const { rows } = await sql<{
            tasks: string | null;
            audit: string | null;
          }>`
          select to_regclass('public.tasks')::text as tasks,
                 to_regnamespace('audit')::text as audit
        `.execute(database);
          expect(rows[0]).toEqual({ tasks: null, audit: null });
        }
      } finally {
        await database.destroy();
      }
    });

    beforeEach(async () => {
      await sql`
      truncate audit.logs, audit.task_actions, public.tasks, public.projects, public.users
      restart identity
    `.execute(database);
      await database
        .insertInto("public.projects")
        .values(
          [projectId, emptyProjectId, otherProjectId].map((id, index) => ({
            project_id: id,
            name: ["Main project", "Empty project", "Other project"][index],
            budget: 100,
            value: 100,
            description: "",
          })),
        )
        .execute();
      await database
        .insertInto("public.tasks")
        .values([
          {
            task_id: firstId,
            task_name: "First",
            description: "",
            project: projectId,
            position: 1,
            cost: 2147483647,
            value: 2,
            steps: 1,
            predecessor: null,
          },
          {
            task_id: secondId,
            task_name: "Second",
            description: "",
            project: projectId,
            position: 2,
            cost: 2147483647,
            value: 3,
            steps: 1,
            predecessor: firstId,
            executed: true,
          },
          {
            task_id: thirdId,
            task_name: "Third",
            description: "",
            project: projectId,
            position: 3,
            cost: 10,
            value: 4,
            steps: 1,
            predecessor: secondId,
          },
          {
            task_id: otherId,
            task_name: "Other",
            description: "",
            project: otherProjectId,
            position: 1,
            cost: 99,
            value: 99,
            steps: 1,
            predecessor: null,
          },
        ])
        .execute();
    });

    it("lists only the requested project in position order, by id and by name", async () => {
      for (const tasks of [
        await queries.getTasksByProjectId(projectId),
        await queries.getTasksByProjectName("Main project"),
      ]) {
        expect(tasks.map((task) => task.task_id)).toEqual([
          firstId,
          secondId,
          thirdId,
        ]);
        expect(tasks[0].executed).toBe(false);
      }
      expect(await queries.getTasksByProjectId(missingId)).toEqual([]);
      expect(await queries.getTasksByProjectName("' OR true --")).toEqual([]);
    });

    it.each([true, false])(
      "filters executed=%s without dropping false",
      async (completed) => {
        const expected = completed ? [secondId] : [firstId, thirdId];
        expect(
          (
            await queries.getTasksByProjectIdAndStatus(projectId, completed)
          ).map((task) => task.task_id),
        ).toEqual(expected);
        expect(
          (
            await queries.getTasksByProjectNameAndStatus(
              "Main project",
              completed,
            )
          ).map((task) => task.task_id),
        ).toEqual(expected);
      },
    );

    it("returns exact bigint totals as strings and zero for empty or missing projects", async () => {
      expect(await queries.getProjectTotalCostById(projectId)).toBe(
        "4294967304",
      );
      expect(await queries.getProjectTotalCostByName("Main project")).toBe(
        "4294967304",
      );
      expect(await queries.getProjectTotalValueById(projectId)).toBe("9");
      expect(await queries.getProjectTotalValueByName("Main project")).toBe(
        "9",
      );
      for (const id of [emptyProjectId, missingId]) {
        expect(await queries.getProjectTotalCostById(id)).toBe("0");
        expect(await queries.getProjectTotalValueById(id)).toBe("0");
      }
      for (const name of ["Empty project", "' OR true --"]) {
        expect(await queries.getProjectTotalCostByName(name)).toBe("0");
        expect(await queries.getProjectTotalValueByName(name)).toBe("0");
      }
    });

    it("returns predecessors nearest-first and terminates on cycles", async () => {
      expect(
        (await queries.getTaskPredecessors(thirdId)).map(
          (task) => task.task_id,
        ),
      ).toEqual([secondId, firstId]);
      expect(await queries.getTaskPredecessors(firstId)).toEqual([]);
      expect(await queries.getTaskPredecessors(missingId)).toEqual([]);
      await database
        .updateTable("public.tasks")
        .set({ predecessor: thirdId })
        .where("task_id", "=", firstId)
        .execute();
      expect(
        (await queries.getTaskPredecessors(thirdId)).map(
          (task) => task.task_id,
        ),
      ).toEqual([secondId, firstId, thirdId]);
    });

    it("reorders in both directions, keeps other projects unchanged, and allows no-op moves", async () => {
      await queries.updateTaskPosition(thirdId, 1);
      expect(
        (await queries.getTasksByProjectId(projectId)).map((task) => [
          task.task_id,
          task.position,
        ]),
      ).toEqual([
        [thirdId, 1],
        [firstId, 2],
        [secondId, 3],
      ]);
      await queries.updateTaskPosition(thirdId, 3);
      await queries.updateTaskPosition(thirdId, 3);
      expect(
        (await queries.getTasksByProjectId(projectId)).map(
          (task) => task.task_id,
        ),
      ).toEqual([firstId, secondId, thirdId]);
      expect(
        (await queries.getTasksByProjectId(otherProjectId))[0].position,
      ).toBe(1);
    });

    it("surfaces invalid moves without changing task order", async () => {
      await expect(queries.updateTaskPosition(missingId, 1)).rejects.toThrow(
        "does not exist",
      );
      await expect(queries.updateTaskPosition(firstId, 0)).rejects.toThrow(
        "out of range",
      );
      await expect(queries.updateTaskPosition(firstId, 4)).rejects.toThrow(
        "out of range",
      );
      await expect(queries.updateTaskPosition(firstId, 1.5)).rejects.toThrow(
        "integer",
      );
      expect(
        (await queries.getTasksByProjectId(projectId)).map(
          (task) => task.task_id,
        ),
      ).toEqual([firstId, secondId, thirdId]);
    });

    it("preserves the email domain, audit identity, foreign keys, and task constraints", async () => {
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
          .updateTable("public.tasks")
          .set({ predecessor: firstId })
          .where("task_id", "=", firstId)
          .execute(),
      ).rejects.toThrow("tasks_no_self_predecessor");
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
  },
);

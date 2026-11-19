import { readFile } from "node:fs/promises";
import { sql, type Kysely } from "kysely";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, expect } from "vitest";
import type { Database } from "../../database/types.js";
import { createDatabase } from "../../database/db.js";

export const projectId = "00000000-0000-4000-8000-000000000001";
export const emptyProjectId = "00000000-0000-4000-8000-000000000002";
export const otherProjectId = "00000000-0000-4000-8000-000000000003";
export const firstId = "00000000-0000-4000-8000-000000000011";
export const secondId = "00000000-0000-4000-8000-000000000012";
export const thirdId = "00000000-0000-4000-8000-000000000013";
export const otherId = "00000000-0000-4000-8000-000000000014";
export const missingId = "00000000-0000-4000-8000-000000000099";

export function useQueryDatabase() {
  const connectionString = process.env.TEST_DATABASE_URL;
  let database: Kysely<Database>;
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
      new URL("../../database/db-schemas.sql", import.meta.url),
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
            DROP TABLE public.task_predecessors;
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
      truncate audit.logs, audit.task_actions, public.task_predecessors, public.tasks, public.projects, public.users
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
        },
      ])
      .execute();
    await database
      .insertInto("public.task_predecessors")
      .values([
        { task_id: secondId, predecessor_id: firstId },
        { task_id: thirdId, predecessor_id: secondId },
      ])
      .execute();
  });

  return () => database;
}

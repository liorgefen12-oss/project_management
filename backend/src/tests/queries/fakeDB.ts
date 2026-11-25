import { readFile } from "node:fs/promises";
import { sql, type Kysely } from "kysely";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, expect } from "vitest";
import type { Database } from "../../database/types.js";
import { createDatabase } from "../../database/db.js";

export const projectId = "00000000-0000-4000-8000-000000000001";
export const projectId_empty = "00000000-0000-4000-8000-000000000002";
const projectId_other = "00000000-0000-4000-8000-000000000003";
export const taskId_1 = "00000000-0000-4000-8000-000000000011";
export const taskId_2 = "00000000-0000-4000-8000-000000000012";
export const taskId_3 = "00000000-0000-4000-8000-000000000013";
const taskId_other = "00000000-0000-4000-8000-000000000014";

export function getDirectPredecessors(db: Kysely<Database>, taskId: string) {
  return db
    .selectFrom("public.task_predecessors as p")
    .innerJoin("public.tasks as t", "t.task_id", "p.predecessor_id")
    .select(["t.task_id", "t.executed"])
    .where("p.task_id", "=", taskId)
    .orderBy("t.task_id")
    .execute();
}

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
        [projectId, projectId_empty, projectId_other].map((id, index) => ({
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
          task_id: taskId_1,
          task_name: "First",
          description: "",
          project: projectId,
          position: 1,
          cost: 2147483647,
          value: 2,
          steps: 1,
        },
        {
          task_id: taskId_2,
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
          task_id: taskId_3,
          task_name: "Third",
          description: "",
          project: projectId,
          position: 3,
          cost: 10,
          value: 4,
          steps: 1,
        },
        {
          task_id: taskId_other,
          task_name: "Other",
          description: "",
          project: projectId_other,
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
        { task_id: taskId_2, predecessor_id: taskId_1 },
        { task_id: taskId_3, predecessor_id: taskId_2 },
      ])
      .execute();
  });

  return () => database;
}

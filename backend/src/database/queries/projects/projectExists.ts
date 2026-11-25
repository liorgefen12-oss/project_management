import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

export async function projectExists(db: Kysely<Database>, projectId: string) {
  const project = await db
    .selectFrom("public.projects")
    .select("project_id")
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  return project !== undefined;
}

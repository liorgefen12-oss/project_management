import type { Kysely } from "kysely";
import type { Database } from "../../types.js";
import { projectColumns } from "./projectColumns.js";

export function getProjectById(db: Kysely<Database>, projectId: string) {
  return db
    .selectFrom("public.projects")
    .select(projectColumns)
    .where("project_id", "=", projectId)
    .executeTakeFirst();
}

import type { Kysely } from "kysely";
import type { Database } from "../../types.js";
import { projectColumns } from "./projectColumns.js";

export function getProjectByName(db: Kysely<Database>, projectName: string) {
  return db
    .selectFrom("public.projects")
    .select(projectColumns)
    .where("name", "=", projectName)
    .executeTakeFirst();
}

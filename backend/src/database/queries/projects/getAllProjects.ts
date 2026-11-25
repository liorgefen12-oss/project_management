import type { Kysely } from "kysely";
import type { Database } from "../../types.js";
import { projectColumns } from "./projectColumns.js";

export function getAllProjects(db: Kysely<Database>) {
  return db
    .selectFrom("public.projects")
    .select(projectColumns)
    .orderBy("name")
    .execute();
}

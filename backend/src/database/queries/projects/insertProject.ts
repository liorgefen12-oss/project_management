import type { Kysely } from "kysely";
import type { Database, NewProject } from "../../types.js";
import { projectColumns } from "./projectColumns.js";

export function insertProject(db: Kysely<Database>, project: NewProject) {
  return db
    .insertInto("public.projects")
    .values(project)
    .returning(projectColumns)
    .executeTakeFirstOrThrow();
}

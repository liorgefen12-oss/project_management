import type { Kysely } from "kysely";
import type { Database, Project, ProjectUpdate } from "../../types.js";
import { refreshProjectGoalsMet } from "./refreshProjectGoalsMet.js";

export async function updateProject(
  db: Kysely<Database>,
  projectId: string,
  changes: Pick<ProjectUpdate, "name" | "description" | "budget" | "goals">,
): Promise<Project> {
  if (!db.isTransaction) {
    return db.transaction().execute((trx) => updateProject(trx, projectId, changes));
  }
  await db
    .updateTable("public.projects")
    .set(changes)
    .where("project_id", "=", projectId)
    .executeTakeFirstOrThrow();
  return refreshProjectGoalsMet(db, projectId);
}

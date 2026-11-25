import type { Kysely } from "kysely";
import type { Database } from "../../types.js";

export async function areAllProjectTasksExecuted(
  db: Kysely<Database>,
  projectId: string,
) {
  const projectTasks = db
    .selectFrom("public.tasks")
    .select("task_id")
    .where("project", "=", projectId);
  const completedProject = await db
    .selectFrom("public.projects")
    .select("project_id")
    .where("project_id", "=", projectId)
    .where((eb) => eb.exists(projectTasks))
    .where((eb) => eb.not(eb.exists(projectTasks.where("executed", "=", false))))
    .executeTakeFirst();
  return completedProject !== undefined;
}

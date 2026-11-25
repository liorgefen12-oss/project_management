import { sql, type Kysely } from "kysely";
import type { Database } from "../../types.js";
import { projectColumns } from "./projectColumns.js";

// Call while holding the project row lock so task creation/execution and goal edits serialize.
export function refreshProjectGoalsMet(db: Kysely<Database>, projectId: string) {
  return db
    .updateTable("public.projects")
    .set({
      goals_met: sql<boolean | null>`(
        select case
          when count(*) = 0 or not bool_and(executed) or public.projects.goals is null
            then null
          else sum(cost) < (public.projects.goals->>'cost')::numeric
            and sum(steps) < (public.projects.goals->>'steps')::numeric
        end
        from public.tasks
        where project = public.projects.project_id
      )`,
    })
    .where("project_id", "=", projectId)
    .returning(projectColumns)
    .executeTakeFirstOrThrow();
}

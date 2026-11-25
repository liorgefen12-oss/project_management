import type { Kysely } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import type { Database } from "../../types.js";

// Board view: every column except the owning project id
export function getProjectBoardTasks(
  db: Kysely<Database>,
  projectId: string,
  executed?: boolean,
) {
  let query = db
    .selectFrom("public.tasks as t")
    .select([
      "task_id",
      "task_name",
      "description",
      "cost",
      "value",
      "steps",
      "executed",
      "position",
    ])
    .select((eb) => [
      jsonArrayFrom(
        eb
          .selectFrom("public.task_predecessors as p")
          .select("p.predecessor_id")
          .whereRef("p.task_id", "=", "t.task_id")
          .orderBy("p.predecessor_id"),
      ).as("predecessor_ids"),
    ])
    .where("project", "=", projectId)
    .orderBy("position");
  if (executed !== undefined) {
    query = query.where("executed", "=", executed);
  }
  return query.execute();
}

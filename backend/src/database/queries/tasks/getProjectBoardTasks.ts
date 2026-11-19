import type { Db } from "./shared.js";

// Board view: every column except the owning project id
export function getProjectBoardTasks(
  db: Db,
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
    .where("project", "=", projectId)
    .orderBy("position");
  if (executed !== undefined) {
    query = query.where("executed", "=", executed);
  }
  return query.execute();
}

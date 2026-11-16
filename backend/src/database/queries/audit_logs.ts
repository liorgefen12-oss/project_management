import type { Kysely } from "kysely";
import type { Database } from "../types.js";

type Db = Kysely<Database>;

const logsByRecentFirst = (db: Db) =>
  db
    .selectFrom("audit.logs as l")
    .selectAll("l")
    .orderBy("l.created_at", "desc")
    .orderBy("l.log_id", "desc");

export async function logAction(
  db: Db,
  userId: string,
  actionName: string,
  ids: { projectId?: string; taskId?: string } = {},
) {
  const action = await db
    .selectFrom("audit.task_actions")
    .select("action_id")
    .where("action_name", "=", actionName)
    .executeTakeFirstOrThrow();

  await db
    .insertInto("audit.logs")
    .values({
      user_id: userId,
      action_id: action.action_id,
      project_id: ids.projectId ?? null,
      task_id: ids.taskId ?? null,
    })
    .execute();
}

export function getLogs(db: Db) {
  return logsByRecentFirst(db).execute();
}

export function getLogsByProjectId(db: Db, projectId: string) {
  return logsByRecentFirst(db)
    .where("l.project_id", "=", projectId)
    .execute();
}

export function getLogsByProjectName(db: Db, projectName: string) {
  return db
    .selectFrom("audit.logs as l")
    .innerJoin("public.projects as p", "p.project_id", "l.project_id")
    .selectAll("l")
    .where("p.name", "=", projectName)
    .orderBy("l.created_at", "desc")
    .orderBy("l.log_id", "desc")
    .execute();
}

function getLogsByActionNames(db: Db, actionNames: string[]) {
  return db
    .selectFrom("audit.logs as l")
    .innerJoin("audit.task_actions as a", "a.action_id", "l.action_id")
    .selectAll("l")
    .where("a.action_name", "in", actionNames)
    .orderBy("l.created_at", "desc")
    .orderBy("l.log_id", "desc");
}

export function getUserLogins(db: Db) {
  return getLogsByActionNames(db, ["user log in"]).execute();
}

export function getProjectSignInsAndOuts(db: Db) {
  return getLogsByActionNames(db, [
    "project sign in",
    "project sign out",
  ]).execute();
}

import { sql, type Kysely } from "kysely";
import type { Database, NewProject, Project, ProjectUpdate } from "../types.js";

type Db = Kysely<Database>;

const projectColumns = [
  "project_id",
  "name",
  "budget",
  "value",
  "description",
  "goals",
  "goals_met",
] as const;

export function getAllProjects(db: Db) {
  return db
    .selectFrom("public.projects")
    .select(projectColumns)
    .orderBy("name")
    .execute();
}

export function getProjectById(db: Db, projectId: string) {
  return db
    .selectFrom("public.projects")
    .select(projectColumns)
    .where("project_id", "=", projectId)
    .executeTakeFirst();
}

export function getProjectByName(db: Db, projectName: string) {
  return db
    .selectFrom("public.projects")
    .select(projectColumns)
    .where("name", "=", projectName)
    .executeTakeFirst();
}

export function insertProject(db: Db, project: NewProject) {
  return db
    .insertInto("public.projects")
    .values(project)
    .returning(projectColumns)
    .executeTakeFirstOrThrow();
}

export function getProjectByIdForUpdate(db: Db, projectId: string) {
  return db
    .selectFrom("public.projects")
    .select(projectColumns)
    .where("project_id", "=", projectId)
    .forUpdate()
    .executeTakeFirst();
}

export async function updateProject(
  db: Db,
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

// Call while holding the project row lock so task creation/execution and goal edits serialize.
export function refreshProjectGoalsMet(db: Db, projectId: string) {
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

export async function projectExists(db: Db, projectId: string) {
  const project = await db
    .selectFrom("public.projects")
    .select("project_id")
    .where("project_id", "=", projectId)
    .executeTakeFirst();
  return project !== undefined;
}

export async function areAllProjectTasksExecuted(db: Db, projectId: string) {
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

// Budget check and update in ONE atomic statement: the WHERE clause only
// matches if there's enough budget. Returns undefined when it doesn't.
export function spendBudgetOnTask(
  db: Db,
  projectId: string,
  cost: number,
  value: number,
) {
  return db
    .updateTable("public.projects")
    .set((eb) => ({
      budget: eb("budget", "-", cost),
      value: eb("value", "+", value),
    }))
    .where("project_id", "=", projectId)
    .where("budget", ">=", cost)
    .returning(["project_id", "budget", "value"])
    .executeTakeFirst();
}

import Koa from "koa";
import { bodyParser } from "@koa/bodyparser";
import session from "koa-session";
import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { vi } from "vitest";
import type { Database } from "../../database/types.js";
import { logAction } from "../../database/queries/audit_logs.js";
import {
  areAllProjectTasksExecuted,
  getProjectById,
  getProjectByIdForUpdate,
  projectExists,
  spendBudgetOnTask,
  insertProject,
  updateProject,
  refreshProjectGoalsMet,
} from "../../database/queries/projects.js";
import {
  getTaskByIdForUpdate,
  getTaskById,
  getTaskProjectBudget,
  getTaskAllPredecessors,
  areTaskPredecessorsExecuted,
  getTaskProject,
  insertTask,
  markExecuted,
  updateTask,
  getProjectBoardTasks,
  getProjectTaskPredecessors,
} from "../../database/queries/tasks.js";
import { projectsRouter } from "../../routers/projects.js";
import { tasksRouter } from "../../routers/tasks.js";
import { errorHandler } from "../../middlewares/errorHandler.js";

//export the imported functions for other files' readability
export {
  areAllProjectTasksExecuted,
  areTaskPredecessorsExecuted,
  getProjectByIdForUpdate,
  getTaskAllPredecessors,
  getTaskByIdForUpdate,
  getTaskProjectBudget,
  insertProject,
  insertTask,
  logAction,
  markExecuted,
  updateProject,
  refreshProjectGoalsMet,
  updateTask,
};
//------provide smaple data and actions for tests
export const userId = "00000000-0000-4000-8000-000000000001";
export const projectId = "00000000-0000-4000-8000-000000000002";
export const taskId = "00000000-0000-4000-8000-000000000003";
export const task = {
  task_id: taskId,
  task_name: "Test task",
  description: "",
  project: projectId,
  cost: 10,
  value: 5,
  steps: 1,
  position: 1,
  executed: false,
  predecessor_ids: [],
};
const updatedProject = { project_id: projectId, budget: 90, value: 5 };

const database = new Kysely<Database>({
  dialect: {
    createDriver: () => new DummyDriver(), //fake connect to a db
    createAdapter: () => new PostgresAdapter(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createIntrospector: (db) => new PostgresIntrospector(db),
  },
});

export const app = new Koa();
app.context.database = database;
app.use(errorHandler);
app.use(bodyParser());
app.use(session({ signed: false }, app));
app.use(async (ctx, next) => {
  ctx.session!.userId = userId;
  await next();
});
app.use(projectsRouter.routes());
app.use(tasksRouter.routes());

export function resetControllerMocks() {
  vi.resetAllMocks();
  vi.mocked(projectExists).mockResolvedValue(true);
  vi.mocked(getTaskByIdForUpdate).mockResolvedValue(task);
  vi.mocked(getTaskById).mockResolvedValue(task);
  vi.mocked(getTaskProjectBudget).mockResolvedValue({
    budget: updatedProject.budget,
  });
  vi.mocked(getTaskAllPredecessors).mockResolvedValue([]);
  vi.mocked(areTaskPredecessorsExecuted).mockResolvedValue(true);
  vi.mocked(getTaskProject).mockResolvedValue(projectId);
  vi.mocked(getProjectBoardTasks).mockResolvedValue([task]);
  vi.mocked(getProjectTaskPredecessors).mockResolvedValue([]);
  vi.mocked(getProjectById).mockResolvedValue({
    ...updatedProject,
    name: "Project",
    description: "",
    goals: null,
    goals_met: null,
  });
  vi.mocked(getProjectByIdForUpdate).mockResolvedValue({
    ...updatedProject,
    name: "Project",
    description: "",
    goals: null,
    goals_met: null,
  });
  vi.mocked(spendBudgetOnTask).mockResolvedValue(updatedProject);
  vi.mocked(areAllProjectTasksExecuted).mockResolvedValue(false);
}

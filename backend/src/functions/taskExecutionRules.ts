import type { Kysely } from "kysely";
import type { Database, Task } from "../database/types.js";
import {
  areTaskPredecessorsExecuted as queryPredecessorExecution,
  getTaskAllPredecessors,
  getTaskById,
  getTaskProjectBudget,
  getTaskProject,
  getTasksByProjectIdAndStatus,
} from "../database/queries/tasks.js";
import { messages } from "../messages.js";

export interface ExecutionCheck {
  executable: boolean;
  reason: string;
}

export async function isTaskWithinProjectBudget(
  db: Kysely<Database>,
  task: Task,
): Promise<ExecutionCheck> {
  const project = await getTaskProjectBudget(db, task.task_id);
  if (!project) {
    throw Object.assign(new Error(messages[404].projectNotFound), {
      status: 404,
      expose: true,
    });
  }
  if (task.cost > project.budget) {
    return { executable: false, reason: messages[409].insufficientBudget };
  }
  return { executable: true, reason: "" };
}

export async function areTaskPredecessorsExecuted(
  db: Kysely<Database>,
  taskId: string,
): Promise<ExecutionCheck> {
  if (await queryPredecessorExecution(db, taskId)) {
    return { executable: true, reason: "" };
  }
  const predecessors = await getTaskAllPredecessors(db, taskId);
  const unfinished = predecessors.find((predecessor) => !predecessor.executed);
  const unfinishedTask = unfinished
    ? await getTaskById(db, unfinished.task_id)
    : undefined;
  return {
    executable: false,
    reason: unfinishedTask
      ? messages[409].completePredecessorFirst(unfinishedTask.task_name)
      : messages[409].invalidPredecessors,
  };
}

export async function canExecuteTask(
  db: Kysely<Database>,
  task: Task,
): Promise<ExecutionCheck> {
  if (task.executed) {
    return { executable: false, reason: messages[409].taskAlreadyExecuted };
  }
  const predecessors = await areTaskPredecessorsExecuted(db, task.task_id);
  if (!predecessors.executable) return predecessors;
  return isTaskWithinProjectBudget(db, task);
}

export async function isTaskProjectCompleted(
  db: Kysely<Database>,
  taskId: string,
): Promise<boolean> {
  const projectId = await getTaskProject(db, taskId);
  if (!projectId) {
    throw Object.assign(new Error(messages[404].taskNotFound), {
      status: 404,
      expose: true,
    });
  }
  const unexecutedTasks = await getTasksByProjectIdAndStatus(db, projectId, false);
  return unexecutedTasks.length === 0;
}

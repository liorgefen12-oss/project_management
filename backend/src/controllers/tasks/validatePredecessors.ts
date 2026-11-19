import type { Context } from "koa";
import type { Kysely } from "kysely";
import type { Database } from "../../database/types.js";
import { getTaskAllPredecessors, getTaskProject } from "../../database/queries/tasks.js";
import { messages } from "../../messages.js";

export async function validatePredecessors(
  ctx: Context,
  db: Kysely<Database>,
  projectId: string,
  predecessorIds: readonly string[],
  taskId?: string,
) {
  for (const predecessorId of predecessorIds) {
    if (predecessorId === taskId) ctx.throw(400, messages[400].selfPredecessor);
    const predecessorProject = await getTaskProject(db, predecessorId);
    if (!predecessorProject) ctx.throw(404, messages[404].predecessorNotFound);
    if (predecessorProject !== projectId) {
      ctx.throw(400, messages[400].sameProjectPredecessors);
    }
    if (taskId) {
      const ancestors = await getTaskAllPredecessors(db, predecessorId);
      if (ancestors.some((ancestor) => ancestor.task_id === taskId)) {
        ctx.throw(400, messages[400].cyclicPredecessors);
      }
    }
  }
}

export function validatePredecessorOrder(
  ctx: Context,
  board: { task_id: string; position: number }[],
  taskPosition: number,
  predecessorIds: readonly string[],
) {
  for (const predecessorId of predecessorIds) {
    const predecessor = board.find((task) => task.task_id === predecessorId);
    if (!predecessor || predecessor.position >= taskPosition) {
      ctx.throw(400, messages[400].predecessorOrderViolation);
    }
  }
}

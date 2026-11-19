import type { Context } from "koa";
import type { z } from "zod";
import {
  getTaskById,
  getTaskByIdForUpdate,
  getProjectBoardTasks,
  getProjectTaskPredecessors,
  lockProjectTaskChanges,
  updateTaskPosition,
} from "../../database/queries/tasks.js";
import { messages } from "../../messages.js";
import type { idParamSchema, moveTaskSchema } from "../../zod/schemas.js";

export async function moveTask(ctx: Context) {
  const { params, body } = ctx.state.validated as {
    params: z.infer<typeof idParamSchema>;
    body: z.infer<typeof moveTaskSchema>;
  };
  const dragged_wanted_pos = body.position;
  //task being moved - its initial data, before moving
  const initial_dragged_task = await getTaskById(ctx.database, params.id);
  if (!initial_dragged_task) return ctx.throw(404, messages[404].taskNotFound);

  const tasks = await ctx.database.transaction().execute(async (trx) => {
    await lockProjectTaskChanges(trx, initial_dragged_task.project);
    //is moving even possible
    const dragged_task = await getTaskByIdForUpdate(trx, params.id);
    //moving task, now locked until transaction is committed or rolled back

    if (!dragged_task) return ctx.throw(404, messages[404].taskNotFound);

    //an array of all tasks in the project
    const board = await getProjectBoardTasks(trx, dragged_task.project);
    //
    if (!board.some((task) => task.position >= dragged_wanted_pos)) {
      //no task in the board is in the wanted location - the wanted location doesnt exist
      ctx.throw(400, messages[400].taskPositionOutOfRange);
    }
    const dragged_cur_pos = dragged_task.position;
    const new_pos_by_id = new Map(
      board.map((board_task) => {
        let cur_after_move_pos = board_task.position;
        //the task checked for the new positions simulation
        // is the one being dragged
        if (board_task.task_id === params.id) {
          cur_after_move_pos = dragged_wanted_pos;
        } else if (
          //dragged task moves back in the queue
          dragged_cur_pos < dragged_wanted_pos &&
          cur_after_move_pos > dragged_cur_pos &&
          cur_after_move_pos <= dragged_wanted_pos
        ) {
          cur_after_move_pos -= 1;
        } else if (
          //dragged task moves forward in the queue
          dragged_wanted_pos < dragged_cur_pos &&
          cur_after_move_pos >= dragged_wanted_pos &&
          cur_after_move_pos < dragged_cur_pos
        ) {
          cur_after_move_pos += 1;
        }
        return [board_task.task_id, cur_after_move_pos] as const;
      }),
    );
    const dependencies = await getProjectTaskPredecessors(
      trx,
      dragged_task.project,
    );

    for (const d of dependencies) {
      const dependent_new_pos = new_pos_by_id.get(d.task_id);
      const predecessor_new_pos = new_pos_by_id.get(d.predecessor_id);
      if (
        //new simulated positions are invalid, throw
        dependent_new_pos === undefined ||
        predecessor_new_pos === undefined ||
        predecessor_new_pos >= dependent_new_pos
      ) {
        ctx.throw(400, messages[400].predecessorOrderViolation);
      }
    }
    //if checks went through, update
    await updateTaskPosition(trx, params.id, dragged_wanted_pos);
    return getProjectBoardTasks(trx, dragged_task.project);
  });
  ctx.body = { message: messages[200].taskMovedSuccessfully, tasks };
}

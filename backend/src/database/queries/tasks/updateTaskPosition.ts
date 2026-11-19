import { sql } from "kysely";
import type { Db } from "./shared.js";

export async function updateTaskPosition(
  db: Db,
  taskId: string,
  newPosition: number,
): Promise<void> {
  if (!Number.isInteger(newPosition)) {
    throw new RangeError("Task position must be an integer.");
  }
  await sql`
    select public.update_task_position(${taskId}::uuid, ${newPosition}::integer)
  `.execute(db);
}

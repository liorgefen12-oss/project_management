import { sql, type Kysely } from "kysely";
import type { Database } from "../../types.js";

export async function updateTaskPosition(
  db: Kysely<Database>,
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

import type { Kysely } from "kysely";
import type { Database } from "../../types.js";
import {
  getTaskAllPredecessors,
  type TaskPredecessor,
} from "./getTaskAllPredecessors.js";

export async function areTaskPredecessorsExecuted(
  db: Kysely<Database>,
  taskId: string,
  predecessors?: readonly TaskPredecessor[],
): Promise<boolean> {
  const allPredecessors = predecessors ?? await getTaskAllPredecessors(
    db,
    taskId,
    { includeInvalid: true },
  );
  return allPredecessors.every(
    (predecessor) => predecessor.executed && !predecessor.invalid,
  );
}

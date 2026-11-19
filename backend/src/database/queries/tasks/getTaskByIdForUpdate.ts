import { taskById, type Db } from "./shared.js";

// Row lock so a double-click can't execute the same task twice
export function getTaskByIdForUpdate(db: Db, taskId: string) {
  return taskById(db, taskId).forUpdate().executeTakeFirst();
}

import { taskById, type Db } from "./shared.js";

export function getTaskById(db: Db, taskId: string) {
  return taskById(db, taskId).executeTakeFirst();
}

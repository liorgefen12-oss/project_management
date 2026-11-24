import { getTaskById, type Db } from "./shared.js";

export function GetTaskById(db: Db, taskId: string) {
  return getTaskById(db, taskId).executeTakeFirst();
}

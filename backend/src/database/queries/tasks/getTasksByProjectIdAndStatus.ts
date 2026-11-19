import { tasksById, type Db } from "./shared.js";

export const getTasksByProjectIdAndStatus = (
  db: Db,
  projectId: string,
  completed: boolean,
) => tasksById(db, projectId).where("executed", "=", completed).execute();

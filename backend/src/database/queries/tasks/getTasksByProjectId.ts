import { tasksById, type Db } from "./shared.js";

export const getTasksByProjectId = (db: Db, projectId: string) =>
  tasksById(db, projectId).execute();

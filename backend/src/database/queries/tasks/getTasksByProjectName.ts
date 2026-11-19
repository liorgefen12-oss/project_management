import { tasksByName, type Db } from "./shared.js";

export const getTasksByProjectName = (db: Db, projectName: string) =>
  tasksByName(db, projectName).execute();

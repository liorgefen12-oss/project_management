import { tasksByName, type Db } from "./shared.js";

export const getTasksByProjectNameAndStatus = (
  db: Db,
  projectName: string,
  completed: boolean,
) => tasksByName(db, projectName).where("t.executed", "=", completed).execute();

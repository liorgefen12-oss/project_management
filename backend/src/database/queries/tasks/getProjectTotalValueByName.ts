import { totalByName, type Db } from "./shared.js";

export const getProjectTotalValueByName = (db: Db, projectName: string) =>
  totalByName(db, projectName, "value");

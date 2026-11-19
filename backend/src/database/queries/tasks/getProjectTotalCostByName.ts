import { totalByName, type Db } from "./shared.js";

export const getProjectTotalCostByName = (db: Db, projectName: string) =>
  totalByName(db, projectName, "cost");

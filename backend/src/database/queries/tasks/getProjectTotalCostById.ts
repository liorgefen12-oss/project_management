import { totalById, type Db } from "./shared.js";

export const getProjectTotalCostById = (db: Db, projectId: string) =>
  totalById(db, projectId, "cost");

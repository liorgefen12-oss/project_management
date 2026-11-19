import { totalById, type Db } from "./shared.js";

export const getProjectTotalValueById = (db: Db, projectId: string) =>
  totalById(db, projectId, "value");

import type { Transaction } from "kysely";
import { logAction } from "../../database/queries/audit_logs.js";
import {
  areAllProjectTasksExecuted,
  refreshProjectGoalsMet,
} from "../../database/queries/projects.js";
import type { Database } from "../../database/types.js";

// Called after task execution while the transaction holds the project row lock.
export async function logProjectCompletion(
  trx: Transaction<Database>,
  userId: string,
  projectId: string,
) {
  await refreshProjectGoalsMet(trx, projectId);
  if (await areAllProjectTasksExecuted(trx, projectId)) {
    await logAction(trx, userId, "project completed", { projectId });
  }
}

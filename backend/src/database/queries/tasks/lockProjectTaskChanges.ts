import { sql, type Transaction } from "kysely";
import type { Database } from "../../types.js";

// lock the project when a task is being moved until the procedure is done
export async function lockProjectTaskChanges(
  transaction: Transaction<Database>,
  projectId: string,
): Promise<void> {
  //save current project's as numeric hash (locking can be performed on 64-bit ints)
  const projectLockKey = sql`hashtextextended(${projectId}::text, 0)`;
  //lock the project
  const transactionLock = sql`pg_advisory_xact_lock(${projectLockKey})`.as(
    "lock_acquired",
  );
  //execute the locking on the db ()
  await transaction.selectNoFrom(transactionLock).execute();
}

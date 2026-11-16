import { Kysely, PostgresDialect } from "kysely";
import type { Pool } from "pg";
import type { Database } from "./types.js";

export type { Database } from "./types.js";

export function createDatabase(pool: Pool): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });
}

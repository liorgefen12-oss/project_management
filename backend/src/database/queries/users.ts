import type { Kysely } from "kysely";
import type { Database } from "../types.js";

type Db = Kysely<Database>;

// Includes the password hash: only use for credential checks
export function getUserWithPasswordByEmail(db: Db, email: string) {
  return db
    .selectFrom("public.users")
    .select(["user_id", "first_name", "last_name", "email", "password"])
    .where("email", "=", email)
    .executeTakeFirst();
}

export async function userExists(db: Db, user_id: string) {
  const user = await db
    .selectFrom("public.users")
    .select("user_id")
    .where("user_id", "=", user_id)
    .executeTakeFirst();
  return user !== undefined;
}

export function getUserById(db: Db, userId: string) {
  return db
    .selectFrom("public.users")
    .select(["user_id", "first_name", "last_name", "email"]) // never the password
    .where("user_id", "=", userId)
    .executeTakeFirst();
}

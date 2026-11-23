import "dotenv/config";
import { Pool } from "pg";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config.js";
import { createDatabase } from "./database/db.js";
import { PgSessionStore } from "./sessionStore.js";

const environment = loadEnvironment();
const pool = new Pool({ connectionString: environment.DATABASE_URL });
const database = createDatabase(pool);
const sessionStore = new PgSessionStore(pool);
const app = createApp({
  frontendOrigin: environment.FRONTEND_ORIGIN,
  secureCookies:
    environment.SESSION_COOKIE_SECURE ?? environment.NODE_ENV === "production",
  sessionSecret: environment.SESSION_SECRET,
  sessionStore,
});

app.context.database = database;

app.listen(environment.PORT, () => {
  console.log(`Backend listening on port ${environment.PORT}`);
});

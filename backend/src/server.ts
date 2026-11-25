import "dotenv/config";
import { Pool } from "pg";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config.js";
import { createDatabase } from "./database/db.js";
import { PgSessionStore } from "./sessionStore.js";

const environment = loadEnvironment();
const pool = new Pool({ connectionString: environment.DATABASE_URL });
// Without a listener, an idle client error (e.g. the database restarting) crashes the process
pool.on("error", (error) => console.error("Idle PostgreSQL client error", error));
const database = createDatabase(pool);
const sessionStore = new PgSessionStore(pool);
const app = createApp({
  //koa app
  frontendOrigin: environment.FRONTEND_ORIGIN,
  secureCookies:
    environment.SESSION_COOKIE_SECURE ?? environment.NODE_ENV === "production",
  sessionSecret: environment.SESSION_SECRET,
  sessionStore,
  trustProxy: environment.TRUST_PROXY,
});

app.context.database = database;

const server = app.listen(environment.PORT, () => {
  console.log(
    `Backend listening on port ${environment.PORT}, frontend origin is ${environment.FRONTEND_ORIGIN}`,
  );
});

let shuttingDown = false;
function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    database
      .destroy() // also ends the pg pool
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        console.error("Error while closing the database", error);
        process.exit(1);
      });
  });
  // Don't hang forever on keep-alive connections
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

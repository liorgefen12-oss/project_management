# Backend

TypeScript/Koa API scaffold using PostgreSQL, Kysely, and server-side sessions.

## Setup

1. Install Node.js 20.19 or newer and PostgreSQL 16 or 17.
2. From this directory, install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` and a private `SESSION_SECRET` (at least 32 characters).
4. Point `DATABASE_URL` at the existing `fullstack_db` on `localhost:5433`. No restore or migration is needed; its existing data stays in place. Set up any other database separately before connecting.
5. Run `npm run dev`.

The API listens on port 3000 by default. `GET /health` is available at the root and does not require a database connection. Session storage uses PostgreSQL and creates its session table when first needed.

Koa uses a different session cookie format from Express, so existing sessions
will require users to sign in again after the migration.

## Scripts

- `npm run dev` starts the API with automatic reload.
- `npm run build` type-checks and compiles to `dist/`.
- `npm start` starts the compiled API.
- `npm test` runs the Vitest suite.

## Database schema

`src/database/types.ts` describes `public.users`, `public.projects`, `public.tasks`,
`audit.task_actions`, and `audit.logs`. Table names are schema-qualified so queries
do not depend on the connection's search path.

The test-only `src/database/test-schema.sql` recreates the backup's tables,
`outlook_email` domain, identity sequence, defaults, primary/unique/foreign keys,
task checks, deferred project/position uniqueness, and all ten SQL functions.
It preserves function behavior, including cycle handling and task reordering.
Vendor-specific `pg_attver` column metadata, dump session settings, ownership,
and grants are not copied. The fixture contains no backed-up data.

The application uses the existing database directly and does not create or
migrate its schema. If the schema changes, update the Kysely types and affected
queries to match.

## Queries

Run queries in the backend, never in the browser or `frontend/src/Kysely_Queries`.
For example, with the `database` created in `src/server.ts`:

```ts
import { createProjectQueries } from './database/queries.js';

const queries = createProjectQueries(database);
const tasks = await queries.getTasksByProjectId(projectId);
const pending = await queries.getTasksByProjectNameAndStatus(projectName, false);
const cost = await queries.getProjectTotalCostById(projectId);
const predecessors = await queries.getTaskPredecessors(taskId);
await queries.updateTaskPosition(taskId, 2);
```

The helpers match the stored functions using camelCase names:

| Helpers | Behavior |
| --- | --- |
| `getTasksByProjectId`, `getTasksByProjectName` | Tasks ordered by position |
| `getTasksByProjectIdAndStatus`, `getTasksByProjectNameAndStatus` | Same, filtered by `executed` |
| `getProjectTotalCostById`, `getProjectTotalCostByName` | Sum task costs |
| `getProjectTotalValueById`, `getProjectTotalValueByName` | Sum task values, not the project's `value` column |
| `getTaskPredecessors` | Calls the cycle-safe stored function; nearest predecessor first |
| `updateTaskPosition` | Calls the stored function to shift neighboring tasks atomically |

Totals are decimal **strings**, preserving PostgreSQL `bigint` precision and
remaining JSON-safe. Empty or missing projects return `"0"` totals and empty
task lists, matching the SQL functions. SQL parameters are bound, not interpolated.
Database errors propagate to the caller. A query set can also be created with a
Kysely transaction: `createProjectQueries(transaction)`.

Project/task HTTP routes and authorization rules are not implemented. Query
helpers are backend building blocks, not publicly accessible endpoints.

## Database integration tests

The schema/query tests require a **separate, empty, disposable** database named
`fullstack_kysely_test`. Set `TEST_DATABASE_URL` in the shell before `npm test`.
Never point it at `fullstack_db`. Tests create the schema from the SQL fixture,
insert synthetic data, truncate their tables between cases, and remove the
fixture's objects afterward.
Without that variable the PostgreSQL tests are skipped; the health test still runs.

# Backend

TypeScript/Koa API scaffold using PostgreSQL, Kysely, and server-side sessions.

## Setup

1. Install Node.js 20.19 or newer and start Docker Desktop.
2. From this directory, install dependencies with `npm install`.
3. Copy `.env.example` to `.env` if it does not exist and set a private `SESSION_SECRET` (at least 32 characters).
4. From the repository root, run `docker compose up -d --wait db`.
5. Run `npm run dev`.

Compose runs PostgreSQL 17 on `localhost:5434` with local-development credentials
`app` / `app`. It creates `fullstack_db`, initialized from
`src/database/db-schemas.sql`, and an empty `fullstack_kysely_test` database.
The backend `.env` uses `DATABASE_URL` for the former and `TEST_DATABASE_URL`
for the latter. Only the tests read `TEST_DATABASE_URL`; application startup
does not require it. These credentials are for local development only.

If another PostgreSQL service already uses port 5433, Compose cannot start.
Resolve that port conflict before starting it; do not remove an existing
database or its volume. This Compose service uses its own named volume and
does not import data from an existing PostgreSQL installation.

Initialization scripts run only when the Compose volume is empty. Schema edits
are picked up by the tests on their next run, but existing development databases
need explicit schema updates. `docker compose down` preserves the volume;
adding `-v` erases its development data, so do not use it to apply schema changes.
When running the API in Docker, copy `.env.example` to `.env` in this directory
and set a private `SESSION_SECRET` of at least 32 characters. From the repository
root, run `docker compose up --build -d --wait`; the API will be available at
`http://localhost:3000`. Compose overrides `DATABASE_URL` for the container to
use `db:5432` on the Docker network. `FRONTEND_ORIGIN` in `.env` must match the
origin serving the frontend.

To run the API on your machine instead, keep using `npm run dev` with
`DATABASE_URL` pointing to `localhost:5434`.

The API listens on port 3000 by default. `GET /health` is available at the root and does not require a database connection. Session storage uses PostgreSQL and creates its session table when first needed.

Koa uses a different session cookie format from Express, so existing sessions
will require users to sign in again after the migration.

## Scripts

- `npm run dev` starts the API with automatic reload.
- `npm run build` type-checks and compiles to `dist/`.
- `npm start` starts the compiled API.
- `npm test` runs the Vitest suite.

## API endpoints

### Postman

Import `fullstack.postman_collection.json` into Postman. In the collection's
Variables tab, set `email` and `password` for an existing database user. The
default `baseUrl` is `http://localhost:3000`. Keep credentials local; do not
export or commit a collection containing real passwords.
Alternatively, enter credentials directly in Login's Body > raw > JSON.
The login pre-request script uses collection variables only when the body is
`{}`; manually entered JSON is left unchanged.

Run the entire collection in order with the Collection Runner. It creates a
uniquely named project, two predecessor tasks, and a dependent task, then saves
`projectId`, `projectName`, `firstPredecessorId`, `secondPredecessorId`, and
`taskId` automatically. It verifies that the dependent task is blocked until
both predecessors execute, executes the task, and checks that it cannot execute
again. The intentionally rejected execution requests expect 409 and pass.
The final project budget is 60 and value is 20.

Postman keeps the session cookie automatically; keep its cookie jar enabled.
Run Logout last. For individual requests using existing data, run Login and
set the relevant IDs yourself. Scenario-specific assertions assume the fresh
fixture created by the collection; they may fail for arbitrary existing data.

**Warning:** every full collection run permanently inserts a new project and
three tasks, changes project budget/value, and writes audit logs. Use disposable
test data. There are no delete endpoints for automatic cleanup. Rerunning the
whole collection creates a fresh project; rerunning only its task folder against
the same project will conflict with previously used positions.

| Method | Path | Authentication | Behavior |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Health check |
| `POST` | `/users/login` | No | Sign in and create a session |
| `POST` | `/users/logout` | Yes | Record logout and clear the session |
| `GET` | `/users/me` | Yes | Return the signed-in user |
| `GET` | `/projects/` | Yes | List projects |
| `POST` | `/projects/` | Yes | Create a project from `name`, `description`, `budget`; project value starts at 0; returns 201 (409 on duplicate name) |
| `GET` | `/projects/:id` | Yes | Get a project |
| `GET` | `/projects/by-name?name=...` | Yes | Get a project by its exact name; 404 if missing |
| `GET` | `/projects/by-task/:id` | Yes | Get the full project owning task `:id`; 404 if the task is missing |
| `GET` | `/projects/:id/completed` | Yes | Return `{ project_id, completed }`; requires at least one task and all tasks executed |
| `GET` | `/projects/:id/tasks` | Yes | List a project's tasks in board order; optional `?executed=true` or `?executed=false` |
| `POST` | `/projects/:id/sign-in` | Yes | Record opening or joining a project board; returns 204 |
| `POST` | `/projects/:id/sign-out` | Yes | Record leaving or closing a project board; returns 204 |
| `POST` | `/tasks/` | Yes | Create a task with optional `predecessor_ids`; returns 201 (400 if placed before a predecessor, 409 if the position is taken) |
| `GET` | `/tasks/by-name?name=...` | Yes | Return all tasks with this exact name across projects; an empty array if none match |
| `GET` | `/tasks/:id` | Yes | Get a task, including cost, value, and owning project ID; 404 if missing |
| `PATCH` | `/tasks/:id` | Yes | Edit an unexecuted task; returns 200 with `{ message, task }` |
| `PATCH` | `/tasks/:id/position` | Yes | Reorder a task and shift its neighbors without placing tasks before their predecessors; returns 200 with `{ message, tasks }` (the updated board) |
| `GET` | `/tasks/:id/predecessors` | Yes | All direct and indirect predecessors as `{ task_id, executed }` rows, deduplicated and nearest first; 404 for a missing task |
| `GET` | `/tasks/:id/executable` | Yes | Returns the JSON boolean `true` or `false`; 404 for a missing task or project |
| `POST` | `/tasks/:id/execute` | Yes | Execute a task |
| `GET` | `/audit-logs` | Yes | List all audit log records; optional `?type=user-logins` or `?type=project-sign-ins-and-outs` filters by category |
| `GET` | `/audit-logs/projects/:id` | Yes | List logs for a project id |
| `GET` | `/audit-logs/projects/by-name?name=...` | Yes | List logs for a project name |

Audit-log listing is available to any authenticated user. Login returns a
session cookie; send it with subsequent authenticated requests.
Every successful login clears previous session data, deletes the old stored
session, and issues a new session ID. Password hashing and login verification
both use the shared helpers backed by `bcryptjs`.

Response text is centralized in `src/messages.ts` as `messages[statusCode].key`,
including parameterized messages. Existing success payloads remain unchanged.
Errors return `{ message }`; validation errors additionally retain structured
`errors` (Zod issues) and include an `errorMessages` array of readable strings.
Malformed JSON returns 400 with the shared malformed-JSON message.

### Lookups and project status

Name lookups trim surrounding whitespace and match the exact, case-sensitive
name. Task names are not unique, so task-name lookup returns an array; project
names are unique, so project-name lookup returns one object. Both require a
nonempty `name` query parameter (400 otherwise).

For board filtering, omitting `executed` returns all tasks. Only the literal
strings `true` and `false` are accepted; other values return 400. Filtered results
keep the same fields and position ordering as the unfiltered board. Missing
projects return 404, including on the completion endpoint.

An empty project is **not completed**. Completion is calculated from current
tasks on each request; it is not stored as a separate project flag.

Task responses already contain cost/value, and project responses contain
budget/value. Business rules reuse those queries rather than issuing separate
scalar metric queries. The task-total sum helpers remain available internally;
they calculate sums across tasks, not the project's current budget/value.
Task records no longer embed `predecessor_ids` or predecessor objects. Fetch
predecessors through the dedicated endpoint or join queries. Creating/editing
tasks still accepts `predecessor_ids` to update the junction table.

The client should call the project sign-in/out endpoints when entering/leaving
a board; ordinary GET requests do not create visit records. Each POST records
one event, including repeated calls.

Successful login/logout record `user log in` / `user log out`. Task execution
records `task completed`, plus `budget changed` / `value changed` when those
amounts change, with both project and task IDs. A blocked predecessor or
insufficient budget records `popup - unavailable task` before returning 409.
These are server-side attempt records; they do not prove a popup was displayed.

After a successful task execution, project completion is checked in the project
query/controller files and `project completed` is recorded if the project has
at least one task and no tasks remain unexecuted. The project row lock serializes task executions, and completion and
successful-task audit records commit with the task transaction. Completion is
derived from tasks; no completed column is added to the projects table.
The completion event identifies the project and user executing its final task.

Task creation, editing, and reordering do not generate audit events.

### Editing and reordering tasks

`PATCH /tasks/:id` accepts any nonempty subset of `task_name`, `description`,
`cost`, `value`, `steps`, and `predecessor_ids`. For example:

```json
{ "task_name": "Updated dashboard", "cost": 40, "predecessor_ids": [] }
```

Omitted fields are preserved. `predecessor_ids` replaces the direct dependency
list, and `[]` removes all dependencies. Dependencies must exist in the same
project and be earlier on the board than the task; self-links, duplicates, and
cycles are rejected. Changes to `project`, `position`, and `executed` are not
accepted here. Executed tasks are read-only
(409) so edits cannot invalidate the project's already-applied budget/value.
Invalid input returns 400; missing tasks or predecessors return 404.

`PATCH /tasks/:id/position` accepts `{ "position": 2 }`. Positions start at 1;
zero, fractions, positions beyond the board's maximum position, and moves that
would put a task before a predecessor (or a dependent task before it) return
400. The existing SQL function shifts neighboring tasks atomically. Moving to
the current position is allowed, as is moving an executed task. The response's
`tasks` array contains the entire board in its new order.

Both operations run in transactions and serialize edits/moves per project
using a transaction-scoped advisory lock. Dependency validation runs under that
lock so concurrent edits cannot introduce a cycle. Edits also lock the task row
to serialize with execution.

## Database schema

`src/database/types.ts` describes `public.users`, `public.projects`, `public.tasks`,
`public.task_predecessors`,
`audit.task_actions`, and `audit.logs`. Table names are schema-qualified so queries
do not depend on the connection's search path.

The shared `src/database/db-schemas.sql` recreates the backup's tables,
`outlook_email` domain, identity sequence, defaults, primary/unique/foreign keys,
task checks, deferred project/position uniqueness, and all ten SQL functions.
Predecessors are stored in `task_predecessors(task_id, predecessor_id)`, not
in a column on `tasks`. Its composite primary key prevents duplicate links,
its check prevents self-dependencies, and both foreign keys cascade on deletion.
The predecessor SQL function is updated to traverse this table, deduplicate
shared ancestors, and terminate on cycles. Task reordering is unchanged.
Vendor-specific `pg_attver` column metadata, dump session settings, ownership,
and grants are not copied. The fixture contains no backed-up data.

Compose applies this schema to a fresh development database; tests apply the same
file to the disposable test database. The application itself does not create or
migrate the application schema. If it changes, update the Kysely types and
affected queries to match.

## Queries

Run queries in the backend, never in the browser or `frontend/src/Kysely_Queries`.
For example, with the `database` created in `src/server.ts`:

The backend is split into three layers:

- `src/database/queries/` – one file per table (`tasks.ts`, `projects.ts`,
  `users.ts`, `audit_logs.ts`) containing all Kysely queries for that table.
  Each query takes the database (or a transaction) as its first argument.
- `src/controllers/` – Koa handlers that call the queries. Task and project
  handlers each have their own file under `tasks/` and `projects/`, respectively.
  Audit log and user handlers stay in `audit_logs.ts` and `users.ts`.
- `src/routers/` – endpoint definitions that wire middleware to controllers.

```ts
import {
  getTasksByProjectId,
  getTasksByProjectNameAndStatus,
  getProjectTotalCostById,
  getTaskAllPredecessors,
  updateTaskPosition,
} from './database/queries/tasks.js';

const tasks = await getTasksByProjectId(database, projectId);
const pending = await getTasksByProjectNameAndStatus(database, projectName, false);
const cost = await getProjectTotalCostById(database, projectId);
const predecessors = await getTaskAllPredecessors(database, taskId);
await updateTaskPosition(database, taskId, 2);
```

The helpers match the stored functions using camelCase names:

| Helpers | Behavior |
| --- | --- |
| `getTasksByProjectId`, `getTasksByProjectName` | Tasks ordered by position |
| `getTasksByProjectIdAndStatus`, `getTasksByProjectNameAndStatus` | Same, filtered by `executed` |
| `getProjectTotalCostById`, `getProjectTotalCostByName` | Sum task costs |
| `getProjectTotalValueById`, `getProjectTotalValueByName` | Sum task values, not the project's `value` column |
| `getTaskById`, `getTaskByIdForUpdate` | Task fields only; the latter also locks its row |
| `getTaskProjectBudget` | Joins a task to its owning project and retrieves the budget for execution rules |
| `getTasksByName` | All exact task-name matches across projects, without embedded predecessor data |
| `getProjectByName` | One project by its exact, unique name |
| `getTaskProject` | Owning project ID for a task; the project-by-task handler then fetches the project record |
| `getProjectBoardTasks` | Board fields ordered by position, optionally filtered by an `executed` boolean |
| `areAllProjectTasksExecuted` | True only for an existing, nonempty project with no unexecuted tasks |
| `getTaskDirectPredecessors` | Joins the junction table to tasks; returns direct `{ task_id, executed }` rows |
| `getTaskAllPredecessors` | Recursively joins the junction table to tasks; returns only `{ task_id, executed }` rows, deduplicated and nearest first; excludes the requested task even in cycles |
| `areTaskPredecessorsExecuted` | Checks the entire predecessor graph in SQL; unfinished/missing ancestors and cycles return false; no predecessors returns true |
| `insertTask(db, task, predecessorIds)` | Atomically inserts a task and all predecessor links |
| `updateTask(db, taskId, changes, predecessorIds?)` | Atomically updates editable fields and optionally replaces predecessor links; HTTP controller enforces graph and execution rules |
| `updateTaskPosition` | Calls the stored function to shift neighboring tasks atomically |

Totals are decimal **strings**, preserving PostgreSQL `bigint` precision and
remaining JSON-safe. Empty or missing projects return `"0"` totals and empty
task lists, matching the SQL functions. SQL parameters are bound, not interpolated.
Database errors propagate to the caller. A query set can also be created with a
Kysely transaction; pass that transaction as the first argument to a query.

### Task execution checks

`src/functions/taskExecutionRules.ts` contains three asynchronous eligibility functions:

- `isTaskWithinProjectBudget(db, task)` queries the owning project's budget
  through `getTaskProjectBudget` and compares it with the task's cost.
- `areTaskPredecessorsExecuted(db, taskId)` uses the task queries to check every
  predecessor branch and reject cycles. On failure it also retrieves the
  unfinished task's name for a useful error reason.
- `canExecuteTask(db, task)` rejects an already-executed task, calls the
  predecessor rule, then calls the budget rule. No precomputed predecessor
  boolean or project object is passed by the controller.

Each rule returns exactly `{ executable: boolean, reason: string }`. The reason
is empty on success and contains the error text on rejection. Missing project
data raises a 404, and database failures propagate rather than being reported
as an ordinary rule rejection.

`GET /tasks/:id/executable` loads the task and returns only the combined rule's
`executable` boolean. `POST /tasks/:id/execute` locks the task in a transaction,
calls the same combined rule, and rejects a failed check with its `reason` as
the 409 error message. Only an approved task reaches the atomic project update
and `markExecuted`. The controller does not fetch or inspect predecessors for
execution eligibility; predecessor-listing and dependency-edit validation remain
separate operations.

The database predecessor query shares the recursive SQL used by
`getTaskAllPredecessors`. A flat ID/executed array alone cannot describe cycles,
so the SQL check preserves that protection. A task without predecessors needs
only to be unexecuted and affordable by its own project.

These are read-only eligibility checks, not a reservation of the project's budget.
The execution endpoint retains its row lock and atomic budget update to guard
against concurrent requests. If another task spends the budget after the rule
check, that atomic update still rejects the attempt without marking it executed.

The same file also exports `isTaskProjectCompleted(db, taskId)`. It resolves
the task's project with `getTaskProject`, retrieves that project's unexecuted
tasks with `getTasksByProjectIdAndStatus(db, projectId, false)`, and returns
`true` only when the returned array is empty. Query results are arrays, not
`null`. A missing task raises a 404, and database failures propagate.

Call the helper after marking a task executed (using the same transaction) to
check completion including that change. It is a backend helper, not a function
the frontend imports directly; a frontend needs an API response to decide
whether to display a completion popup. The existing
`GET /projects/:id/completed` endpoint already exposes completion by project ID.

Create a task with `POST /tasks/` and a JSON body such as:

```json
{
  "task_name": "Build dashboard",
  "description": "Display project progress",
  "cost": 50,
  "value": 20,
  "steps": 3,
  "position": 4,
  "project": "00000000-0000-4000-8000-000000000001",
  "predecessor_ids": [
    "00000000-0000-4000-8000-000000000002",
    "00000000-0000-4000-8000-000000000003"
  ]
}
```

Omit `predecessor_ids` or use `[]` for no predecessors. IDs must be unique,
valid UUIDs of existing tasks in the same project. Invalid input returns 400;
missing projects or predecessors return 404. The old singular `predecessor`
field is no longer accepted. `executed` remains optional and defaults to false.
The response contains the created task's fields, including its generated
`task_id`. Use `GET /tasks/:id/predecessors` to retrieve predecessor states.

The new backup still contains a stale SQL `get_task_predecessors` function
referencing the removed column. The backend query does not call that function;
it works directly against the new junction table. The corrected SQL definition
is included in the schema fixture for fresh databases. No backup restore or
automatic migration of an existing database is performed.

## Database integration tests

The schema/query tests require a **separate, empty, disposable** database named
`fullstack_kysely_test`. From the repository root, start the database with
`docker compose up -d --wait db`, then run `npm test` from `backend/`.
Vitest loads `backend/.env`, including `TEST_DATABASE_URL`, using its setup file.
Never point it at `fullstack_db`. Tests create the schema from the SQL fixture,
insert synthetic data, truncate their tables between cases, and remove the
fixture's objects afterward.
The tests refuse a different database name or a nonempty database before applying
the schema. Test files run sequentially to avoid conflicts over shared tables.
If a run is interrupted and leaves tables behind, inspect the test database
before cleaning it up; the next run deliberately refuses to overwrite it.

Without `TEST_DATABASE_URL` the PostgreSQL tests are skipped; unit tests and HTTP
tests with mocked queries and an in-memory session store still run. With a URL
configured, an unavailable database fails the suite rather than silently skipping.
The database tests currently cover schema and queries, not `PgSessionStore`;
the application's session table is created lazily by that store.

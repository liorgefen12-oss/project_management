# Backend

REST API for the project management board, built with Koa, TypeScript, PostgreSQL and Kysely.
tested with Vitest.

## Getting started

Requirements:

- Node.js 20.19+
- Docker

1. From the repository root, copy `backend/.env.example` to `backend/.env` and set `SESSION_SECRET` (at least 32 characters).
2. Run the whole stack from the repository root:

   ```bash
   docker compose up --build -d --wait
   ```
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - Database: `localhost:5434` (user `app`, password `app`)

To run the API locally instead:

```bash
docker compose up -d --wait db
cd backend
npm install
npm run dev
```

### Manual database setup

Docker creates the schema for a new database, but does not insert users or audit
actions. In pgAdmin, add a user with an `@outlook.com` email and a bcrypt-hashed
password, and ensure `audit.task_actions` contains these action names:

- `user log in`
- `user log out`
- `project sign in`
- `project sign out`
- `project completed`
- `task completed`
- `task created`
- `budget changed`
- `goals changed`
- `value changed`
- `popup - unavailable task`

Existing databases keep their data; no automatic seeding is performed.

## Environment variables

- `PORT` — The port the API listens on (defaults to `3000`).
- `DATABASE_URL` — Connection URL for the main `fullstack_db` database.
- `TEST_DATABASE_URL` — Connection URL for `fullstack_kysely_test`, used only by tests.
- `SESSION_SECRET` — Private key used to sign session cookies.
- `FRONTEND_ORIGIN` — The frontend address allowed to make API requests.

## Scripts

- `npm run dev` — Start the API with hot reload.
- `npm run build` — Compile the backend into `dist/`.
- `npm start` — Run the compiled API.
- `npm test` — Run the test suite.

## API

All endpoints except `/health` and `/users/login` require logging in first.

### Health and login

- `GET /health` — Check that the API is running.
- `POST /users/login` — Log in.
- `POST /users/logout` — Log out.
- `GET /users/me` — Get the currently logged-in user.

### Projects

- `GET /projects` — List projects.
- `POST /projects` — Create a project.
- `GET /projects/:id` — Get a project's details.
- `PATCH /projects/:id` — Update a project.
- `GET /projects/by-name?name=...` — Find a project by name.
- `GET /projects/:id/completed` — Check whether all tasks in a project are complete.
- `GET /projects/:id/tasks` — List a project's tasks; optionally filter with `?executed=true` or `?executed=false`.
- `POST /projects/:id/sign-in` — Record entering a project.
- `POST /projects/:id/sign-out` — Record leaving a project.

### Tasks

- `POST /tasks` — Create a task.
- `GET /tasks/:id` — Get a task's details.
- `PATCH /tasks/:id` — Update a task.
- `PATCH /tasks/:id/position` — Move a task to a different position.
- `GET /tasks/:id/predecessors` — List the tasks that must come before this task.
- `GET /tasks/:id/executable` — Check whether a task can be executed.
- `POST /tasks/:id/execute` — Execute a task.

### Audit logs

- `GET /audit-logs` — List audit log entries.
- `GET /audit-logs/projects/:id` — Get audit logs for a project.
- `GET /audit-logs/projects/by-name?name=...` — Get audit logs for a project by name.

To try the API, import `fullstack.postman_collection.json` into Postman.

## Business rules

### Project goals

For an existing database, ensure `public.projects` has a nullable boolean
`goals_met` column before starting the updated backend. New databases already
include this column in the schema. Existing results can be backfilled manually
through pgAdmin.

The API recalculates `goals_met` when a task is executed or created, or a project
is edited. It is `NULL` for incomplete/empty projects or when no goals are set.
For completed projects with goals, both total task cost and total task steps
must be strictly below their respective `goals.cost` and `goals.steps` limits;
equal to either limit means `false`. Goal edits are logged as `goals changed`.
Direct task/goal changes in pgAdmin bypass the API and do not automatically
recalculate `goals_met`; use the app for subsequent edits.

- A task can be executed only if all its predecessors are executed and the project's budget covers its cost.
- Executing a task subtracts its cost from the project budget and adds its value to the project value.
- Executed tasks cannot be edited.
- A task cannot be positioned on the board before its predecessors.
- A project is completed when all its tasks are executed.
- Logins, logouts, project sign-ins/outs and task executions are recorded in the audit log.

## Project structure

```
src/
  routers/       endpoint definitions
  controllers/   request handlers
  database/      schema, types and queries
  functions/     business rules
  middlewares/   auth, sessions, validation, errors
  zod/           request validation schemas
  tests/         Vitest tests
```

## Tests

The suite covers project and task operations, execution and dependency rules,
and authentication. It includes both mocked controller tests and PostgreSQL
integration tests.

```bash
docker compose up -d --wait db
npm test
```

Database tests require `TEST_DATABASE_URL` and use an empty, disposable
`fullstack_kysely_test` database with fake data. They are skipped when the
variable is not set.

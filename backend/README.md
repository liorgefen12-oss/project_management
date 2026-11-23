# Backend

REST API for the project management board, built with Koa, TypeScript, PostgreSQL and Kysely.
tested with Vitest.

## Getting started

Requires Node.js 20.19+ and Docker.

1. Copy `.env.example` to `.env` and set `SESSION_SECRET` (at least 32 characters).
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

## Environment variables

| Name                | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `PORT`              | API port (default 3000)                                     |
| `DATABASE_URL`      | Main database (`fullstack_db`)                              |
| `TEST_DATABASE_URL` | Test database (`fullstack_kysely_test`), used only by tests |
| `SESSION_SECRET`    | Secret for session cookies                                  |
| `FRONTEND_ORIGIN`   | Frontend URL allowed by CORS                                |

## Scripts

| Command         | Description           |
| --------------- | --------------------- |
| `npm run dev`   | Start with hot reload |
| `npm run build` | Compile to `dist/`    |
| `npm start`     | Run the compiled API  |
| `npm test`      | Run tests             |

## API

All endpoints except `/health` and `/users/login` require logging in first.

| Method  | Path                                    | Description                                  |
| ------- | --------------------------------------- | -------------------------------------------- |
| `GET`   | `/health`                               | Health check                                 |
| `POST`  | `/users/login`                          | Log in                                       |
| `POST`  | `/users/logout`                         | Log out                                      |
| `GET`   | `/users/me`                             | Current user                                 |
| `GET`   | `/projects`                             | List projects                                |
| `POST`  | `/projects`                             | Create a project                             |
| `GET`   | `/projects/:id`                         | Get a project                                |
| `PATCH` | `/projects/:id`                         | Edit a project                               |
| `GET`   | `/projects/by-name?name=...`            | Get a project by name                        |
| `GET`   | `/projects/by-task/:id`                 | Get a task's project                         |
| `GET`   | `/projects/:id/completed`               | Is the project completed                     |
| `GET`   | `/projects/:id/tasks`                   | List tasks (optional `?executed=true/false`) |
| `POST`  | `/projects/:id/sign-in`                 | Record entering a project                    |
| `POST`  | `/projects/:id/sign-out`                | Record leaving a project                     |
| `POST`  | `/tasks`                                | Create a task                                |
| `GET`   | `/tasks/:id`                            | Get a task                                   |
| `PATCH` | `/tasks/:id`                            | Edit a task                                  |
| `PATCH` | `/tasks/:id/position`                   | Move a task                                  |
| `GET`   | `/tasks/:id/predecessors`               | List a task's predecessors                   |
| `GET`   | `/tasks/:id/executable`                 | Can the task be executed                     |
| `POST`  | `/tasks/:id/execute`                    | Execute a task                               |
| `GET`   | `/audit-logs`                           | List audit logs                              |
| `GET`   | `/audit-logs/projects/:id`              | Logs for a project                           |
| `GET`   | `/audit-logs/projects/by-name?name=...` | Logs for a project by name                   |

To try the API, import `fullstack.postman_collection.json` into Postman.

## Business rules

- A task can be executed only if all its predecessors are executed and the project's budget covers its cost.
- Executing a task subtracts its cost from the project budget and adds its value to the project value.
- Executed tasks cannot be edited.
- A task cannot be placed before its predecessors.
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

```bash
docker compose up -d --wait db
npm test
```

Database tests use the separate `fullstack_kysely_test` database, which contains fake data.

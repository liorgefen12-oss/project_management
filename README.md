# Projects Management Board

A fullstack web app for managing projects and their tasks.
Users can:

- log in,
- choose a project, and
- plan, edit and execute the project's tasks.
  Each project has a budget and value, and each task has a cost, a value and predecessor tasks.
  A task can only be executed once its predecessors are done and the budget covers its cost.

## Tools

- **Frontend:** React, TypeScript, Vite, Tanstack Query, Zustand
- **Backend:** Koa, TypeScript, Kysely, Vitest
- **Database:** PostgreSQL 17
- **Infrastructure:** Docker Compose

### Requirements

- docker
- Node.js

## Getting started

1. Copy `backend/.env.example` to `backend/.env` and set `SESSION_SECRET` (at least 32 characters).
2. run:

   ```bash
   docker compose up --build -d --wait
   ```

3. For a new database, use pgAdmin to add the required audit actions and a user
   with a bcrypt-hashed password, as described in the [backend README](backend/README.md).
   Existing databases retain their data.
4. Open http://localhost:5173 and log in with an existing database user.

To stop: `docker compose down`.

## VS Code launch configurations

Select a configuration in **Run and Debug**, then press **F5**:

- **Launch full app (db + backend + frontend):** Development mode. Vite and the
  backend run directly on your computer and watch for source changes; only
  PostgreSQL runs in Docker.
- **Launch full app in Docker (production build):** Builds and runs all three
  services in Docker.
  - Vite builds the frontend files,
  - nginx serves them, and
  - Node.js runs the compiled backend.
    Rebuild to include source changes.

Both run locally, open http://localhost:5173, and use the same database.

Both Dockerfiles use a single stage, so the final images retain the source code
and build dependencies. The frontend image includes Node.js for building and
nginx for serving; the backend runs its compiled JavaScript with Node.js.

## Project structure

```
backend/          REST API      → see backend/README.md
frontend/         React app     → see frontend/README.md
backend/01-create-test-db.sql            creates the empty test database (new Docker volumes only)
backend/src/database/db-schemas.sql      database schema (new Docker volumes and integration tests)
assets/           images
docker-compose.yml
```

For development instructions, see the [backend README](backend/README.md) and the [frontend README](frontend/README.md).

# Projects Management Board

A fullstack web app for managing projects and their tasks. Users log in, choose a project, and plan its tasks on a board. Each project has a budget, and each task has a cost, a value and predecessors. A task can only be executed once its predecessors are done and the budget covers its cost.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tanstack Query, Zustand
- **Backend:** Koa, TypeScript, Kysely, Vitest
- **Database:** PostgreSQL 17
- **Infrastructure:** Docker Compose

### Requirements
 - docker
 - Node.js

## Getting started


1. Copy `backend/.env.example` to `backend/.env` and set `SESSION_SECRET` (at least 32 characters).
2. From this folder, run:

   ```bash
   docker compose up --build -d --wait
   ```

3. Open http://localhost:5173.

To stop: `docker compose down`.

## Project structure

```
backend/          REST API      → see backend/README.md
frontend/         React app     → see frontend/README.md
db-init/          database setup script
assets/           images
docker-compose.yml
```

For development instructions, see the [backend README](backend/README.md) and the [frontend README](frontend/README.md).

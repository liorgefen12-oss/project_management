# Frontend

Project management board UI, built with React, TypeScript and Vite.

## Getting started

Requires Node.js 20.19+. The [backend](../backend/README.md) must be running at http://localhost:3000.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The port must stay 5173, because the backend only accepts requests from that address (`FRONTEND_ORIGIN`).

To run the frontend in Docker instead, use `docker compose up --build -d --wait` from the repository root.

## Scripts

- `npm run dev` — Start the development server.
- `npm run build` — Build the frontend for production.

## Features

- Log in and log out
- Choose a project, or switch between projects
- Create and edit projects, including budget and goals
- See whether a completed project met both its cost and steps goals
- Create, edit, reorder and execute tasks
- Popups that explain why a task can't be executed

## Tech stack

- **React Query**: fetching and caching data from the API
- **Zustand**: global state (logged-in user, selected project)

## Project structure

```
src/
  pages/        app screens (login, project selection, board)
  components/   reusable UI parts
  API/          API calls and React Query hooks
  store/        Zustand global state
  functions/    helper logic
  styles/       CSS files
```

# AGENTS.md

## Purpose
This file gives AI coding agents a quick summary of the repository structure, development commands, and repo-specific conventions so they can work effectively without exploring every file first.

## Repository overview
- Monorepo with two main apps:
  - `backend/`: Express.js REST API for the e-commerce platform.
  - `frontend/`: React + Vite single-page application for customer and admin UI.
- Database schema and seed are in `database/schema.sql` for Microsoft SQL Server.
- The root `README.md` contains setup instructions and feature notes.

## Key areas
- `backend/src/index.js`: backend entrypoint.
- `backend/src/config/db.js`: SQL Server connection pool.
- `backend/src/controllers/`: API business logic.
- `backend/src/routes/`: Express route definitions.
- `backend/src/middleware/`: JWT auth and file upload handling.
- `backend/uploads/`: local storage for payment proof uploads.
- `frontend/src/App.jsx`: route mapping and app shell.
- `frontend/src/context/`: global state for auth, cart, wishlist, compare.
- `frontend/src/pages/`: main customer and admin views.
- `frontend/src/services/api.js`: HTTP wrapper for backend calls.

## Important conventions
- Backend uses SQL Server via `mssql` and expects database config in `backend/.env`.
- Auth is JWT-based with `bcryptjs` password hashing.
- File uploads are handled by `multer` and stored locally under `backend/uploads/`.
- Frontend uses React Router and Tailwind CSS; logic is split between pages, components, and context providers.
- No test scripts are present in this repository at the time of writing.

## Development commands
- Backend
  - `cd backend && npm install`
  - `cd backend && npm run dev`
- Frontend
  - `cd frontend && npm install`
  - `cd frontend && npm run dev`
- Frontend build
  - `cd frontend && npm run build`

## Notes for agents
- Prefer updating existing `AGENTS.md` if new repo-specific instructions are needed later.
- Link to `README.md` for detailed setup and database instructions instead of duplicating all content.
- Use the backend routes/controllers structure to make API changes and the frontend pages/context structure to make UI changes.
- Be careful not to assume a database other than SQL Server; the schema and seed target SQL Server.

## Useful file references
- `README.md`
- `database/schema.sql`
- `backend/src/index.js`
- `frontend/src/App.jsx`
